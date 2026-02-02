//! Funciones de conversión entre tipos Rust y JSON

use serde_json::Value as JsonValue;

/// Convierte un JSON string a serde_json::Value
pub fn parse_json(json_str: &str) -> Result<JsonValue, String> {
  serde_json::from_str(json_str).map_err(|e| format!("JSON parse error: {}", e))
}

/// Convierte serde_json::Value a JSON string
pub fn stringify_json(value: &JsonValue) -> Result<String, String> {
  serde_json::to_string(value).map_err(|e| format!("JSON stringify error: {}", e))
}

/// Convierte serde_json::Value a JSON string pretty-printed
pub fn stringify_json_pretty(value: &JsonValue) -> Result<String, String> {
  serde_json::to_string_pretty(value).map_err(|e| format!("JSON stringify error: {}", e))
}
