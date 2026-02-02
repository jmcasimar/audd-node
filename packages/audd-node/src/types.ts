/**
 * Tipos públicos del SDK AUDD
 */

/**
 * Códigos de error estables
 */
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_SOURCE = 'UNSUPPORTED_SOURCE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  IO_ERROR = 'IO_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
  JSON_ERROR = 'JSON_ERROR',
}

/**
 * Tipo de fuente de datos
 */
export type SourceType = 'file' | 'db' | 'memory';

/**
 * Formato de datos soportado
 */
export type DataFormat = 'json' | 'csv' | 'sqlite' | 'mysql' | 'postgres';

/**
 * Configuración de fuente de archivo
 */
export interface FileSourceConfig {
  type: 'file';
  format: 'json' | 'csv';
  path: string;
  encoding?: string;
  delimiter?: string; // Para CSV
  hasHeader?: boolean; // Para CSV
}

/**
 * Configuración de fuente de base de datos
 */
export interface DbSourceConfig {
  type: 'db';
  format: 'sqlite' | 'mysql' | 'postgres';
  path?: string; // Para SQLite
  host?: string; // Para MySQL/Postgres
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  table: string;
  query?: string; // Opcional: query SQL personalizado
}

/**
 * Configuración de fuente en memoria
 */
export interface MemorySourceConfig {
  type: 'memory';
  format: 'json';
  data: unknown;
}

/**
 * Configuración de fuente unificada
 */
export type SourceConfig = FileSourceConfig | DbSourceConfig | MemorySourceConfig;

/**
 * Opciones para construir IR
 */
export interface BuildIROptions {
  /** Configuración de la fuente */
  source: SourceConfig;
  /** Configuración adicional en formato libre */
  config?: Record<string, unknown>;
}

/**
 * Estrategia de comparación
 */
export type CompareStrategy = 'structural' | 'semantic' | 'hybrid';

/**
 * Opciones para comparación
 */
export interface CompareOptions {
  /** Threshold de similitud (0.0 - 1.0) */
  threshold?: number;
  /** Estrategia de comparación */
  strategy?: CompareStrategy;
  /** Campos a ignorar en la comparación */
  ignoreFields?: string[];
  /** Configuración adicional */
  config?: Record<string, unknown>;
}

/**
 * Estrategia de resolución
 */
export type ResolveStrategy = 'conservative' | 'aggressive' | 'balanced';

/**
 * Preferencia de fuente para resolución
 */
export type SourcePreference = 'a' | 'b' | 'merge';

/**
 * Opciones para proponer resolución
 */
export interface ResolveOptions {
  /** Estrategia de resolución */
  strategy?: ResolveStrategy;
  /** Fuente preferida */
  preferSource?: SourcePreference;
  /** Configuración adicional */
  config?: Record<string, unknown>;
}

/**
 * Opciones para aplicar resolución
 */
export interface ApplyOptions {
  /** Modo dry-run (no aplicar cambios reales) */
  dryRun?: boolean;
  /** Generar backup antes de aplicar */
  backup?: boolean;
  /** Configuración adicional */
  config?: Record<string, unknown>;
}

/**
 * Representación IR (JSON string)
 */
export type IR = string;

/**
 * Resultado de diferencia (JSON string)
 */
export type Diff = string;

/**
 * Plan de resolución (JSON string)
 */
export type Plan = string;

/**
 * Resultado de aplicación (JSON string)
 */
export type ApplyResult = string;

/**
 * Resultado de validación
 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Estructura interna del IR (para referencia)
 * No exponer directamente, usar JSON strings
 */
export interface IRStructure {
  version: string;
  source: {
    type: string;
    format: string;
    path?: string;
  };
  schema: {
    fields: Array<{ name: string; type: string }>;
    primary_keys: string[];
  };
  data: unknown[];
  metadata: {
    rows: number;
    created_at: string;
  };
}
