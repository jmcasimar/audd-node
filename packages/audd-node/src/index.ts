/**
 * SDK principal de AUDD para Node.js
 */

import type {
  BuildIROptions,
  CompareOptions,
  ResolveOptions,
  ApplyOptions,
  IR,
  Diff,
  Plan,
  ApplyResult,
  ValidationResult,
} from './types';
import { AuddError, createError } from './errors';
import { native } from './binding';

/**
 * Motor principal AUDD
 */
export class AuddEngine {
  /**
   * Obtiene la versión del addon nativo
   */
  static getVersion(): string {
    return native.version() as string;
  }

  /**
   * Función de prueba (ping/pong)
   */
  static ping(): string {
    return native.ping() as string;
  }

  /**
   * Construir IR desde una fuente
   *
   * @param options - Opciones de construcción
   * @returns Promise con el IR en formato JSON string
   */
  async buildIR(options: BuildIROptions): Promise<IR> {
    // Validar opciones
    this.validateBuildOptions(options);

    try {
      // Convertir opciones al formato del addon
      const nativeOptions = {
        sourceType: options.source.type,
        format: options.source.format,
        path: 'path' in options.source ? options.source.path : undefined,
        config: options.config ? JSON.stringify(options.config) : undefined,
      };

      const ir = (await native.buildIr(nativeOptions)) as string;
      return ir;
    } catch (error) {
      throw AuddError.fromNativeError(error as Error);
    }
  }

  /**
   * Comparar dos IRs
   *
   * @param irA - IR A en formato JSON string
   * @param irB - IR B en formato JSON string
   * @param options - Opciones de comparación (opcional)
   * @returns Promise con el diff en formato JSON string
   */
  async compare(irA: IR, irB: IR, options?: CompareOptions): Promise<Diff> {
    // Validar IRs
    this.validateIRString(irA, 'irA');
    this.validateIRString(irB, 'irB');

    try {
      // Convertir opciones al formato del addon
      const nativeOptions = options
        ? {
            threshold: options.threshold,
            strategy: options.strategy,
            ignoreFields: options.ignoreFields,
            config: options.config ? JSON.stringify(options.config) : undefined,
          }
        : undefined;

      const diff = (await native.compare(irA, irB, nativeOptions)) as string;
      return diff;
    } catch (error) {
      throw AuddError.fromNativeError(error as Error);
    }
  }

  /**
   * Proponer plan de resolución desde un diff
   *
   * @param diff - Diff en formato JSON string
   * @param options - Opciones de resolución (opcional)
   * @returns Promise con el plan en formato JSON string
   */
  async proposeResolution(diff: Diff, options?: ResolveOptions): Promise<Plan> {
    // Validar diff
    this.validateJSONString(diff, 'diff');

    try {
      // Convertir opciones al formato del addon
      const nativeOptions = options
        ? {
            strategy: options.strategy,
            preferSource: options.preferSource,
            config: options.config ? JSON.stringify(options.config) : undefined,
          }
        : undefined;

      const plan = (await native.proposeResolution(diff, nativeOptions)) as string;
      return plan;
    } catch (error) {
      throw AuddError.fromNativeError(error as Error);
    }
  }

  /**
   * Aplicar un plan de resolución
   *
   * @param plan - Plan en formato JSON string
   * @param options - Opciones de aplicación (opcional)
   * @returns Promise con el resultado en formato JSON string
   */
  async applyResolution(plan: Plan, options?: ApplyOptions): Promise<ApplyResult> {
    // Validar plan
    this.validateJSONString(plan, 'plan');

    try {
      // Convertir opciones al formato del addon
      const nativeOptions = options
        ? {
            dryRun: options.dryRun,
            backup: options.backup,
            config: options.config ? JSON.stringify(options.config) : undefined,
          }
        : undefined;

      const result = (await native.applyResolution(plan, nativeOptions)) as string;
      return result;
    } catch (error) {
      throw AuddError.fromNativeError(error as Error);
    }
  }

  /**
   * Validar un IR
   *
   * @param ir - IR en formato JSON string
   * @returns Promise con el resultado de validación
   */
  async validateIR(ir: IR): Promise<ValidationResult> {
    try {
      const result = (await native.validateIr(ir)) as string;
      return JSON.parse(result) as ValidationResult;
    } catch (error) {
      throw AuddError.fromNativeError(error as Error);
    }
  }

  // === Métodos privados de validación ===

  private validateBuildOptions(options: BuildIROptions): void {
    if (!options.source) {
      throw createError.invalidInput('Missing source configuration');
    }

    const { source } = options;

    if (!source.type) {
      throw createError.invalidInput('Missing source type');
    }

    if (!source.format) {
      throw createError.invalidInput('Missing source format');
    }

    // Validaciones específicas por tipo
    if (source.type === 'file') {
      if (!('path' in source) || !source.path) {
        throw createError.invalidInput('File source requires path');
      }
    }

    if (source.type === 'db') {
      if (!('table' in source) || !source.table) {
        throw createError.invalidInput('Database source requires table');
      }

      if (source.format === 'sqlite') {
        if (!('path' in source) || !source.path) {
          throw createError.invalidInput('SQLite source requires path');
        }
      } else if (source.format === 'mysql' || source.format === 'postgres') {
        if (!('host' in source) || !source.host) {
          throw createError.invalidInput(`${source.format} source requires host`);
        }
      }
    }
  }

  private validateIRString(ir: string, name: string): void {
    if (typeof ir !== 'string') {
      throw createError.invalidInput(`${name} must be a JSON string`);
    }

    try {
      JSON.parse(ir);
    } catch {
      throw createError.invalidInput(`${name} is not a valid JSON string`);
    }
  }

  private validateJSONString(json: string, name: string): void {
    if (typeof json !== 'string') {
      throw createError.invalidInput(`${name} must be a JSON string`);
    }

    try {
      JSON.parse(json);
    } catch {
      throw createError.invalidInput(`${name} is not a valid JSON string`);
    }
  }
}

/**
 * Exports públicos
 */
export * from './types';
export * from './errors';
export * from './adapters';
