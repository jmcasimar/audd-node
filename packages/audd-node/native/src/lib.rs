//! AUDD Native Node.js Addon
//!
//! Este módulo exporta las funciones principales del core AUDD a Node.js
//! usando N-API para llamadas asíncronas no bloqueantes.

#![deny(clippy::all)]

mod api;
mod convert;
mod errors;

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Versión del addon nativo
#[napi]
pub fn version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}

/// Función de prueba para verificar la conexión con Node
#[napi]
pub fn ping() -> String {
  "pong".to_string()
}

/// Suma dos números (smoke test)
#[napi]
pub fn add(a: i32, b: i32) -> i32 {
  a + b
}

// Re-export de funciones principales desde api.rs
pub use api::*;
