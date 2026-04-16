/**
 * Adaptadores para bases de datos
 */

import { AuddEngine } from '../index';
import type { IR, DbSourceConfig } from '../types';
import { createError } from '../errors';

const DEFAULT_MONGODB_COLLECTION_PLACEHOLDER = '__all__';

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
 * Configuración para conexión MongoDB
 */
export interface MongoDBConfig {
  uri?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  collection?: string;
  options?: Record<string, string | number | boolean>;
}

/**
 * Adaptador base para bases de datos
 */
abstract class DbAdapter {
  constructor(protected engine: AuddEngine) {}

  abstract buildIR(config: SQLiteConfig | RemoteDbConfig | MongoDBConfig): Promise<IR>;

  protected toSqlConnectionString(
    config: RemoteDbConfig,
    scheme: 'mysql' | 'postgres',
    defaultPort: number
  ): string {
    if (!config.username || !config.password || !config.database) {
      throw createError.invalidInput(
        `${scheme} connection requires username, password, and database`
      );
    }

    const username = encodeURIComponent(config.username);
    const password = encodeURIComponent(config.password);
    const database = encodeURIComponent(config.database);
    const host = this.formatHost(config.host);
    const port = config.port ?? defaultPort;

    return `${scheme}://${username}:${password}@${host}:${port}/${database}`;
  }

  protected formatHost(host: string): string {
    if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
      return `[${host}]`;
    }

    return host;
  }
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
        path: this.toSQLiteConnectionString(config.path),
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

  private toSQLiteConnectionString(path: string): string {
    if (path.startsWith('sqlite://')) {
      return path;
    }

    const normalizedPath = path.replaceAll('\\', '/');

    if (normalizedPath.startsWith('/')) {
      return `sqlite://${normalizedPath}`;
    }

    if (/^[A-Za-z]:\//.test(normalizedPath)) {
      return `sqlite:///${normalizedPath}`;
    }

    return `sqlite://${normalizedPath}`;
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
        path: this.toSqlConnectionString(config, 'mysql', 3306),
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
        path: this.toSqlConnectionString(config, 'postgres', 5432),
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
 * Alias por conveniencia para usar el nombre "PostgresAdapter"
 * en lugar de "PostgreSQLAdapter".
 */
export class PostgresAdapter extends PostgreSQLAdapter {}

/**
 * Adaptador para MongoDB
 */
export class MongoDBAdapter extends DbAdapter {
  /**
   * Construye IR desde una base MongoDB
   */
  async buildIR(config: MongoDBConfig): Promise<IR> {
    try {
      this.validateMongoConfig(config);

      const sourceConfig: DbSourceConfig = {
        type: 'db',
        format: 'mongodb',
        path: this.toConnectionString(config),
        table: config.collection ?? DEFAULT_MONGODB_COLLECTION_PLACEHOLDER,
      };

      return this.engine.buildIR({ source: sourceConfig });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createError.dbConnectionFailed(
        `Failed to connect to MongoDB: ${(error as Error).message}`,
        config.uri
          ? { uri: config.uri }
          : { host: config.host, database: config.database }
      );
    }
  }

  private validateMongoConfig(config: MongoDBConfig): void {
    if (config.uri) {
      return;
    }

    if (!config.host) {
      throw createError.invalidInput('MongoDB host is required when uri is not provided');
    }

    if (!config.database) {
      throw createError.invalidInput('MongoDB database is required when uri is not provided');
    }

    if (config.password && !config.username) {
      throw createError.invalidInput('MongoDB username is required when password is provided');
    }

    if (config.username && !config.password) {
      throw createError.invalidInput('MongoDB password is required when username is provided');
    }
  }

  private toConnectionString(config: MongoDBConfig): string {
    if (config.uri) {
      return config.uri;
    }

    const host = this.formatHost(config.host as string);
    const database = encodeURIComponent(config.database as string);
    const port = config.port ?? 27017;

    const credentials = config.username
      ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password as string)}@`
      : '';

    const queryString = config.options
      ? new URLSearchParams(
          Object.entries(config.options).map(
            ([key, value]) => [key, String(value)] as [string, string]
          )
        ).toString()
      : '';

    return `mongodb://${credentials}${host}:${port}/${database}${queryString ? `?${queryString}` : ''}`;
  }
}

/**
 * Factory para crear adaptadores de BD
 */
export class DbAdapterFactory {
  static create(
    engine: AuddEngine,
    format: 'sqlite' | 'mysql' | 'postgres' | 'postgresql' | 'mongodb'
  ): DbAdapter {
    switch (format) {
      case 'sqlite':
        return new SQLiteAdapter(engine);
      case 'mysql':
        return new MySQLAdapter(engine);
      case 'postgres':
      case 'postgresql':
        return new PostgreSQLAdapter(engine);
      case 'mongodb':
        return new MongoDBAdapter(engine);
      default:
        throw createError.unsupportedFormat(format);
    }
  }
}
