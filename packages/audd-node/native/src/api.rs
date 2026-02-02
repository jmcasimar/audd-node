//! API principal del addon que expone las operaciones AUDD a Node.js

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

use crate::errors::AuddNativeError;

/// Opciones para construir IR
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildIROptions {
  /// Tipo de fuente: "file", "db", "memory"
  #[napi(js_name = "sourceType")]
  pub source_type: String,
  
  /// Formato: "json", "csv", "sqlite", etc.
  pub format: String,
  
  /// Path al archivo o base de datos
  pub path: Option<String>,
  
  /// Configuración adicional en JSON
  pub config: Option<String>,
}

/// Opciones para comparación
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompareOptions {
  /// Threshold de similitud (0.0 - 1.0)
  pub threshold: Option<f64>,
  
  /// Estrategia: "structural", "semantic", "hybrid"
  pub strategy: Option<String>,
  
  /// Ignorar campos específicos
  #[napi(js_name = "ignoreFields")]
  pub ignore_fields: Option<Vec<String>>,
  
  /// Configuración adicional en JSON
  pub config: Option<String>,
}

/// Opciones para proponer resolución
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveOptions {
  /// Estrategia: "conservative", "aggressive", "balanced"
  pub strategy: Option<String>,
  
  /// Preferir fuente: "a", "b", "merge"
  #[napi(js_name = "preferSource")]
  pub prefer_source: Option<String>,
  
  /// Configuración adicional en JSON
  pub config: Option<String>,
}

/// Opciones para aplicar resolución
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyOptions {
  /// Dry run (no aplicar cambios reales)
  #[napi(js_name = "dryRun")]
  pub dry_run: Option<bool>,
  
  /// Generar backup antes de aplicar
  pub backup: Option<bool>,
  
  /// Configuración adicional en JSON
  pub config: Option<String>,
}

/// Construir IR desde una fuente
///
/// # Argumentos
/// * `options` - Opciones de construcción
///
/// # Returns
/// JSON string con la representación IR
#[napi]
pub async fn build_ir(options: BuildIROptions) -> Result<String> {
  // TODO: Implementar integración real con audd-core
  // Por ahora, retornamos un IR mock válido
  
  let ir_mock = serde_json::json!({
    "version": "1.0",
    "source": {
      "type": options.source_type,
      "format": options.format,
      "path": options.path,
    },
    "schema": {
      "fields": [],
      "primary_keys": [],
    },
    "data": [],
    "metadata": {
      "rows": 0,
      "created_at": chrono::Utc::now().to_rfc3339(),
    }
  });
  
  Ok(ir_mock.to_string())
}

/// Comparar dos IRs
///
/// # Argumentos
/// * `ir_a_json` - JSON del IR A
/// * `ir_b_json` - JSON del IR B
/// * `options` - Opciones de comparación
///
/// # Returns
/// JSON string con el resultado de la diferencia
#[napi]
pub async fn compare(
  ir_a_json: String,
  ir_b_json: String,
  options: Option<CompareOptions>,
) -> Result<String> {
  // Validar que los JSONs sean válidos
  let _ir_a: serde_json::Value = serde_json::from_str(&ir_a_json)
    .map_err(|e| Error::from_reason(format!("Invalid IR A JSON: {}", e)))?;
    
  let _ir_b: serde_json::Value = serde_json::from_str(&ir_b_json)
    .map_err(|e| Error::from_reason(format!("Invalid IR B JSON: {}", e)))?;
  
  // TODO: Implementar comparación real con audd-core
  let opts = options.unwrap_or(CompareOptions {
    threshold: Some(0.8),
    strategy: Some("structural".to_string()),
    ignore_fields: None,
    config: None,
  });
  
  let diff_mock = serde_json::json!({
    "version": "1.0",
    "source_a": "IR A",
    "source_b": "IR B",
    "options": {
      "threshold": opts.threshold,
      "strategy": opts.strategy,
    },
    "changes": {
      "added": [],
      "removed": [],
      "modified": [],
    },
    "statistics": {
      "total_changes": 0,
      "similarity": 1.0,
    },
    "metadata": {
      "compared_at": chrono::Utc::now().to_rfc3339(),
    }
  });
  
  Ok(diff_mock.to_string())
}

/// Proponer plan de resolución desde un diff
///
/// # Argumentos
/// * `diff_json` - JSON del diff
/// * `options` - Opciones de resolución
///
/// # Returns
/// JSON string con el plan de resolución
#[napi]
pub async fn propose_resolution(
  diff_json: String,
  options: Option<ResolveOptions>,
) -> Result<String> {
  // Validar JSON
  let _diff: serde_json::Value = serde_json::from_str(&diff_json)
    .map_err(|e| Error::from_reason(format!("Invalid diff JSON: {}", e)))?;
  
  // TODO: Implementar generación de plan real
  let opts = options.unwrap_or(ResolveOptions {
    strategy: Some("balanced".to_string()),
    prefer_source: Some("merge".to_string()),
    config: None,
  });
  
  let plan_mock = serde_json::json!({
    "version": "1.0",
    "diff_id": "diff-123",
    "strategy": opts.strategy,
    "actions": [],
    "metadata": {
      "created_at": chrono::Utc::now().to_rfc3339(),
    }
  });
  
  Ok(plan_mock.to_string())
}

/// Aplicar un plan de resolución
///
/// # Argumentos
/// * `plan_json` - JSON del plan
/// * `options` - Opciones de aplicación
///
/// # Returns
/// JSON string con el resultado de la aplicación
#[napi]
pub async fn apply_resolution(
  plan_json: String,
  options: Option<ApplyOptions>,
) -> Result<String> {
  // Validar JSON
  let _plan: serde_json::Value = serde_json::from_str(&plan_json)
    .map_err(|e| Error::from_reason(format!("Invalid plan JSON: {}", e)))?;
  
  // TODO: Implementar aplicación real
  let opts = options.unwrap_or(ApplyOptions {
    dry_run: Some(false),
    backup: Some(true),
    config: None,
  });
  
  let result_mock = serde_json::json!({
    "version": "1.0",
    "plan_id": "plan-123",
    "dry_run": opts.dry_run,
    "applied": true,
    "results": {
      "successful": 0,
      "failed": 0,
      "skipped": 0,
    },
    "metadata": {
      "applied_at": chrono::Utc::now().to_rfc3339(),
    }
  });
  
  Ok(result_mock.to_string())
}

/// Validar un IR JSON
///
/// # Argumentos
/// * `ir_json` - JSON del IR a validar
///
/// # Returns
/// JSON con resultado de validación { ok: bool, errors: string[] }
#[napi]
pub async fn validate_ir(ir_json: String) -> Result<String> {
  match serde_json::from_str::<serde_json::Value>(&ir_json) {
    Ok(ir) => {
      // TODO: Validación estructural profunda
      let has_version = ir.get("version").is_some();
      let has_source = ir.get("source").is_some();
      let has_schema = ir.get("schema").is_some();
      
      let mut errors = Vec::new();
      if !has_version {
        errors.push("Missing required field: version".to_string());
      }
      if !has_source {
        errors.push("Missing required field: source".to_string());
      }
      if !has_schema {
        errors.push("Missing required field: schema".to_string());
      }
      
      let result = serde_json::json!({
        "ok": errors.is_empty(),
        "errors": errors,
      });
      
      Ok(result.to_string())
    }
    Err(e) => {
      let result = serde_json::json!({
        "ok": false,
        "errors": [format!("Invalid JSON: {}", e)],
      });
      Ok(result.to_string())
    }
  }
}
