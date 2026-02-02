/**
 * Adaptadores para bases de datos
 */

import { AuddEngine } from '../index';
import type { IR, DbSourceConfig } from '../types';
import { createError } from '../errors';

/**
 * Configuración para conexión SQLite
 */
export interface SQLiteConfig {
  path: string;
  table: string;
  query?: string;
}

/**
 * Configuración para conexión MySQL/Postgres
 */
export interface RemoteDbConfig {
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  table: string;
  query?: string;
}

/**
 * Adaptador base para bases de datos
 */
abstract class DbAdapter {
  constructor(protected engine: AuddEngine) {}

  abstract buildIR(config: SQLiteConfig | RemoteDbConfig): Promise<IR>;
}

/**
 * Adaptador para SQLite
 */
export class SQLiteAdapter extends DbAdapter {
  /**
   * Construye IR desde una base SQLite
   */
  async buildIR(config: SQLiteConfig): Promise<IR> {
    try {
      // Validar configuración
      if (!config.path) {
        throw createError.invalidInput('SQLite path is required');
      }
      if (!config.table && !config.query) {
        throw createError.invalidInput('Either table or query is required');
      }

      // Construir config para el engine
      const sourceConfig: DbSourceConfig = {
        type: 'db',
        format: 'sqlite',
        path: config.path,
        table: config.table,
        query: config.query,
      };

      return this.engine.buildIR({ source: sourceConfig });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createError.dbConnectionFailed(
        `Failed to connect to SQLite: ${(error as Error).message}`,
        { path: config.path }
      );
    }
  }

  /**
   * Verifica si un archivo SQLite existe y es accesible
   */
  async checkConnection(path: string): Promise<boolean> {
    try {
      const { access } = await import('fs/promises');
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Adaptador para MySQL
 */
export class MySQLAdapter extends DbAdapter {
  /**
   * Construye IR desde una base MySQL
   */
  async buildIR(config: RemoteDbConfig): Promise<IR> {
    try {
      this.validateRemoteConfig(config);

      const sourceConfig: DbSourceConfig = {
        type: 'db',
        format: 'mysql',
        host: config.host,
        port: config.port ?? 3306,
        database: config.database,
        username: config.username,
        password: config.password,
        table: config.table,
        query: config.query,
      };

      return this.engine.buildIR({ source: sourceConfig });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createError.dbConnectionFailed(
        `Failed to connect to MySQL: ${(error as Error).message}`,
        { host: config.host, database: config.database }
      );
    }
  }

  private validateRemoteConfig(config: RemoteDbConfig): void {
    if (!config.host) throw createError.invalidInput('MySQL host is required');
    if (!config.database) throw createError.invalidInput('MySQL database is required');
    if (!config.username) throw createError.invalidInput('MySQL username is required');
    if (!config.password) throw createError.invalidInput('MySQL password is required');
    if (!config.table && !config.query) {
      throw createError.invalidInput('Either table or query is required');
    }
  }
}

/**
 * Adaptador para PostgreSQL
 */
export class PostgreSQLAdapter extends DbAdapter {
  /**
   * Construye IR desde una base PostgreSQL
   */
  async buildIR(config: RemoteDbConfig): Promise<IR> {
    try {
      this.validateRemoteConfig(config);

      const sourceConfig: DbSourceConfig = {
        type: 'db',
        format: 'postgres',
        host: config.host,
        port: config.port ?? 5432,
        database: config.database,
        username: config.username,
        password: config.password,
        table: config.table,
        query: config.query,
      };

      return this.engine.buildIR({ source: sourceConfig });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createError.dbConnectionFailed(
        `Failed to connect to PostgreSQL: ${(error as Error).message}`,
        { host: config.host, database: config.database }
      );
    }
  }

  private validateRemoteConfig(config: RemoteDbConfig): void {
    if (!config.host) throw createError.invalidInput('PostgreSQL host is required');
    if (!config.database) throw createError.invalidInput('PostgreSQL database is required');
    if (!config.username) throw createError.invalidInput('PostgreSQL username is required');
    if (!config.password) throw createError.invalidInput('PostgreSQL password is required');
    if (!config.table && !config.query) {
      throw createError.invalidInput('Either table or query is required');
    }
  }
}

/**
 * Factory para crear adaptadores de BD
 */
export class DbAdapterFactory {
  static create(
    engine: AuddEngine,
    format: 'sqlite' | 'mysql' | 'postgres'
  ): DbAdapter {
    switch (format) {
      case 'sqlite':
        return new SQLiteAdapter(engine);
      case 'mysql':
        return new MySQLAdapter(engine);
      case 'postgres':
        return new PostgreSQLAdapter(engine);
      default:
        throw createError.unsupportedFormat(format);
    }
  }
}
