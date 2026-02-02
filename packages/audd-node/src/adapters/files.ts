/**
 * Adaptadores para leer fuentes de datos y construir IR
 */

import { readFile } from 'fs/promises';
import { AuddEngine } from '../index';
import type { IR, FileSourceConfig } from '../types';
import { createError } from '../errors';

/**
 * Adaptador para archivos JSON
 */
export class JsonFileAdapter {
  constructor(private engine: AuddEngine) {}

  /**
   * Lee un archivo JSON y construye IR
   */
  async buildIR(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<IR> {
    try {
      // Leer archivo
      const content = await readFile(filePath, encoding);

      // Validar JSON
      try {
        JSON.parse(content);
      } catch {
        throw createError.invalidInput('File is not valid JSON', { filePath });
      }

      // Construir IR usando el engine
      const config: FileSourceConfig = {
        type: 'file',
        format: 'json',
        path: filePath,
        encoding,
      };

      return this.engine.buildIR({ source: config });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Ya es un AuddError
      }
      throw createError.ioError(`Failed to read JSON file: ${(error as Error).message}`, {
        filePath,
      });
    }
  }
}

/**
 * Adaptador para archivos CSV
 */
export class CsvFileAdapter {
  constructor(private engine: AuddEngine) {}

  /**
   * Lee un archivo CSV y construye IR
   */
  async buildIR(
    filePath: string,
    options?: {
      encoding?: BufferEncoding;
      delimiter?: string;
      hasHeader?: boolean;
    }
  ): Promise<IR> {
    try {
      // Leer archivo
      const content = await readFile(filePath, options?.encoding ?? 'utf-8');

      // Validar contenido básico
      if (!content.trim()) {
        throw createError.invalidInput('CSV file is empty', { filePath });
      }

      // Construir IR usando el engine
      const config: FileSourceConfig = {
        type: 'file',
        format: 'csv',
        path: filePath,
        encoding: options?.encoding,
        delimiter: options?.delimiter ?? ',',
        hasHeader: options?.hasHeader ?? true,
      };

      return this.engine.buildIR({ source: config });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Ya es un AuddError
      }
      throw createError.ioError(`Failed to read CSV file: ${(error as Error).message}`, {
        filePath,
      });
    }
  }

  /**
   * Parse manual de CSV (helper)
   * Implementación simple - para casos más complejos usar librería como papaparse
   */
  static parseCSV(
    content: string,
    delimiter = ',',
    hasHeader = true
  ): { headers?: string[]; rows: string[][] } {
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return { rows: [] };
    }

    const rows = lines.map((line) =>
      line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''))
    );

    if (hasHeader) {
      const [headers, ...dataRows] = rows;
      return { headers, rows: dataRows };
    }

    return { rows };
  }
}

/**
 * Factory para crear adaptadores de archivos
 */
export class FileAdapterFactory {
  static create(engine: AuddEngine, format: 'json' | 'csv') {
    switch (format) {
      case 'json':
        return new JsonFileAdapter(engine);
      case 'csv':
        return new CsvFileAdapter(engine);
      default:
        throw createError.unsupportedFormat(format);
    }
  }
}
