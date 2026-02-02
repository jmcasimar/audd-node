/**
 * Sistema de errores normalizado para AUDD
 */

import { ErrorCode } from './types';

/**
 * Clase base de error AUDD
 */
export class AuddError extends Error {
  /** Código de error estable */
  public readonly code: ErrorCode;

  /** Detalles adicionales del error */
  public readonly details?: Record<string, unknown>;

  /** Causa original del error */
  public override readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.name = 'AuddError';
    this.code = code;
    this.details = details;
    this.cause = cause;

    // Mantener stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuddError);
    }
  }

  /**
   * Serializa el error a JSON
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }

  /**
   * Crea un error desde un error nativo del addon
   */
  static fromNativeError(error: Error): AuddError {
    // Intentar extraer código del mensaje
    const message = error.message;

    // Mapeo de patrones de mensaje a códigos
    if (message.includes('Invalid') || message.includes('invalid')) {
      return new AuddError(ErrorCode.INVALID_INPUT, message, undefined, error);
    }
    if (message.includes('Unsupported source')) {
      return new AuddError(ErrorCode.UNSUPPORTED_SOURCE, message, undefined, error);
    }
    if (message.includes('Unsupported format')) {
      return new AuddError(ErrorCode.UNSUPPORTED_FORMAT, message, undefined, error);
    }
    if (message.includes('Database') || message.includes('connection')) {
      return new AuddError(ErrorCode.DB_CONNECTION_FAILED, message, undefined, error);
    }
    if (message.includes('IO') || message.includes('file') || message.includes('File')) {
      return new AuddError(ErrorCode.IO_ERROR, message, undefined, error);
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return new AuddError(ErrorCode.TIMEOUT, message, undefined, error);
    }
    if (message.includes('cancelled') || message.includes('Cancelled')) {
      return new AuddError(ErrorCode.CANCELLED, message, undefined, error);
    }
    if (message.includes('JSON')) {
      return new AuddError(ErrorCode.JSON_ERROR, message, undefined, error);
    }

    // Default: internal error
    return new AuddError(ErrorCode.INTERNAL_ERROR, message, undefined, error);
  }
}

/**
 * Helpers para crear errores específicos
 */
export const createError = {
  invalidInput: (message: string, details?: Record<string, unknown>) =>
    new AuddError(ErrorCode.INVALID_INPUT, message, details),

  unsupportedSource: (sourceType: string) =>
    new AuddError(
      ErrorCode.UNSUPPORTED_SOURCE,
      `Unsupported source type: ${sourceType}`,
      { sourceType }
    ),

  unsupportedFormat: (format: string) =>
    new AuddError(ErrorCode.UNSUPPORTED_FORMAT, `Unsupported format: ${format}`, {
      format,
    }),

  dbConnectionFailed: (message: string, details?: Record<string, unknown>) =>
    new AuddError(ErrorCode.DB_CONNECTION_FAILED, message, details),

  ioError: (message: string, details?: Record<string, unknown>) =>
    new AuddError(ErrorCode.IO_ERROR, message, details),

  internalError: (message: string, details?: Record<string, unknown>) =>
    new AuddError(ErrorCode.INTERNAL_ERROR, message, details),

  timeout: (operation: string) =>
    new AuddError(ErrorCode.TIMEOUT, `Operation timeout: ${operation}`, { operation }),

  cancelled: (operation: string) =>
    new AuddError(ErrorCode.CANCELLED, `Operation cancelled: ${operation}`, { operation }),
};
