//! Definición de errores del addon nativo

use thiserror::Error;

/// Errores del addon AUDD
#[derive(Error, Debug)]
pub enum AuddNativeError {
  #[error("Invalid input: {0}")]
  InvalidInput(String),
  
  #[error("Unsupported source type: {0}")]
  UnsupportedSource(String),
  
  #[error("Unsupported format: {0}")]
  UnsupportedFormat(String),
  
  #[error("Database connection failed: {0}")]
  DbConnectionFailed(String),
  
  #[error("IO error: {0}")]
  IoError(String),
  
  #[error("Internal error: {0}")]
  InternalError(String),
  
  #[error("Operation cancelled")]
  Cancelled,
  
  #[error("Operation timeout")]
  Timeout,
  
  #[error("JSON error: {0}")]
  JsonError(String),
}

impl AuddNativeError {
  /// Retorna el código de error estable
  pub fn code(&self) -> &'static str {
    match self {
      Self::InvalidInput(_) => "INVALID_INPUT",
      Self::UnsupportedSource(_) => "UNSUPPORTED_SOURCE",
      Self::UnsupportedFormat(_) => "UNSUPPORTED_FORMAT",
      Self::DbConnectionFailed(_) => "DB_CONNECTION_FAILED",
      Self::IoError(_) => "IO_ERROR",
      Self::InternalError(_) => "INTERNAL_ERROR",
      Self::Cancelled => "CANCELLED",
      Self::Timeout => "TIMEOUT",
      Self::JsonError(_) => "JSON_ERROR",
    }
  }
}
