# Plan de Integración: AUDD Core → Node.js Wrapper

## 📋 Resumen Ejecutivo

Este documento detalla el plan para integrar el **core de AUDD (Rust)** ubicado en `crates/` con el **wrapper de Node.js** en `packages/audd-node`.

**Estado actual**: El wrapper Node.js tiene implementaciones **mock** que retornan JSON de ejemplo. El core AUDD tiene la **lógica real** implementada en Rust.

**Objetivo**: Conectar ambos para que el wrapper Node.js use el core Rust nativo.

---

## 🏗️ Arquitectura del Core AUDD

### Crates Disponibles

```
crates/
├── audd_ir/              # Representación Intermedia (IR) - Esquemas canónicos
├── audd_compare/         # Motor de comparación de esquemas
├── audd_resolution/      # Sistema de resolución de conflictos
├── audd_adapters_file/   # Adaptadores para archivos (CSV, JSON, XML, SQL)
├── audd_adapters_db/     # Adaptadores para bases de datos (SQLite, MySQL, Postgres, MongoDB)
└── audd-cli/             # CLI (usa todos los crates anteriores)
```

### Flujo de Datos del Core

```
Fuente (File/DB)
    ↓
Adapter (audd_adapters_*)
    ↓
SourceSchema (audd_ir)
    ↓
compare() → ComparisonResult (audd_compare)
    ↓
SuggestionEngine → Suggestions (audd_resolution)
    ↓
Decision → Apply
```

---

## 🔌 Estado Actual del Wrapper Node.js

### Estructura

```
packages/audd-node/
├── native/               # Addon N-API (Rust)
│   ├── src/
│   │   ├── lib.rs       # Entry point
│   │   ├── api.rs       # Funciones exportadas (MOCK)
│   │   ├── errors.rs    # Manejo de errores
│   │   └── convert.rs   # Conversiones JSON (sin usar)
│   └── Cargo.toml       # ⚠️ NO incluye crates de audd_*
├── src/                 # SDK TypeScript
│   ├── index.ts         # AuddEngine class
│   ├── types.ts         # Definiciones TypeScript
│   └── adapters/        # Wrappers high-level
└── tests/               # Tests pasando con mocks
```

### Funciones Actuales (api.rs)

| Función | Estado | Retorna |
|---------|--------|---------|
| `build_ir()` | ❌ Mock | JSON con estructura vacía |
| `compare()` | ❌ Mock | JSON con cambios vacíos |
| `propose_resolution()` | ❌ Mock | JSON con acciones vacías |
| `apply_resolution()` | ❌ Mock | JSON con resultado vacío |
| `validate_ir()` | ❌ Mock | JSON de validación básica |

---

## ✅ Plan de Integración

### Fase 1: Configuración de Dependencias

**Archivo**: `packages/audd-node/native/Cargo.toml`

**Importante**: Los crates de AUDD core (`audd_ir`, `audd_compare`, etc.) están en un **proyecto separado**. Necesitas configurar las dependencias según tu setup:

#### Opción 1: Desde crates.io (cuando estén publicados)

```toml
[dependencies]
audd_ir = "0.1"
audd_compare = "0.1"
audd_resolution = "0.1"
audd_adapters_file = "0.1"
audd_adapters_db = { version = "0.1", default-features = false, features = ["sqlite", "mysql", "postgres"] }

# Mantener dependencias existentes...
napi = { version = "2.16.0", default-features = false, features = ["napi8", "async", "error_anyhow"] }
# ...
```

#### Opción 2: Desde repositorio Git

```toml
[dependencies]
audd_ir = { git = "https://github.com/your-org/audd-core", branch = "main" }
audd_compare = { git = "https://github.com/your-org/audd-core", branch = "main" }
audd_resolution = { git = "https://github.com/your-org/audd-core", branch = "main" }
audd_adapters_file = { git = "https://github.com/your-org/audd-core", branch = "main" }
audd_adapters_db = { git = "https://github.com/your-org/audd-core", branch = "main", default-features = false, features = ["sqlite", "mysql", "postgres"] }

# Mantener dependencias existentes...
napi = { version = "2.16.0", default-features = false, features = ["napi8", "async", "error_anyhow"] }
# ...
```

#### Opción 3: Path local (solo para desarrollo)

```toml
[dependencies]
# Ajustar ruta según ubicación de tu proyecto audd-core
audd_ir = { path = "../../../../audd-core/crates/audd_ir" }
audd_compare = { path = "../../../../audd-core/crates/audd_compare" }
audd_resolution = { path = "../../../../audd-core/crates/audd_resolution" }
audd_adapters_file = { path = "../../../../audd-core/crates/audd_adapters_file" }
audd_adapters_db = { path = "../../../../audd-core/crates/audd_adapters_db", default-features = false, features = ["sqlite", "mysql", "postgres"] }

# Mantener dependencias existentes...
napi = { version = "2.16.0", default-features = false, features = ["napi8", "async", "error_anyhow"] }
# ...
```

**Verificación**:
```bash
cd packages/audd-node
pnpm build:native  # Debe compilar sin errores
```

---

### Fase 2: Implementar `build_ir()` Real

**Objetivo**: Reemplazar mock con lógica real que use `audd_adapters_*`.

#### 2.1. Actualizar `BuildIROptions`

```rust
// packages/audd-node/native/src/api.rs

#[napi(object)]
pub struct BuildIROptions {
  #[napi(js_name = "sourceType")]
  pub source_type: String,  // "file" | "db"
  
  pub format: String,        // "csv" | "json" | "sqlite" | "postgres" | ...
  
  pub path: Option<String>,  // Ruta de archivo o connection string
  
  pub config: Option<String>, // JSON adicional
}
```

#### 2.2. Implementar lógica real

```rust
use audd_ir::SourceSchema;
use audd_adapters_file::load_schema_from_file;
use audd_adapters_db::create_connector;

#[napi]
pub async fn build_ir(options: BuildIROptions) -> Result<String> {
  let schema: SourceSchema = match options.source_type.as_str() {
    "file" => {
      let path = options.path
        .ok_or_else(|| Error::from_reason("Missing 'path' for file source"))?;
      
      // Usar adapter de archivos
      load_schema_from_file(&path)
        .map_err(|e| Error::from_reason(format!("File adapter error: {}", e)))?
    }
    
    "db" => {
      let conn_str = options.path
        .ok_or_else(|| Error::from_reason("Missing 'path' (connection string) for db source"))?;
      
      // Usar adapter de DB
      let connector = create_connector(&conn_str)
        .map_err(|e| Error::from_reason(format!("DB connector error: {}", e)))?;
      
      connector.load()
        .map_err(|e| Error::from_reason(format!("DB load error: {}", e)))?
    }
    
    _ => {
      return Err(Error::from_reason(format!(
        "Unsupported source_type: {}. Use 'file' or 'db'", 
        options.source_type
      )));
    }
  };
  
  // Serializar SourceSchema a JSON
  schema.to_json()
    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
}
```

**Testing**:
```typescript
// tests/integration/build-ir.test.ts
const engine = new AuddEngine();
const ir = await engine.buildIR({
  source: {
    type: 'file',
    format: 'csv',
    path: './tests/fixtures/users.csv'
  }
});
expect(ir.entities).toHaveLength(1);
expect(ir.entities[0].fields).toHaveLength(3); // id, name, email
```

---

### Fase 3: Implementar `compare()` Real

**Objetivo**: Usar `audd_compare::compare()` para comparar esquemas.

```rust
use audd_compare::{compare, CompareConfig};

#[napi]
pub async fn compare(
  ir_a_json: String,
  ir_b_json: String,
  options: Option<CompareOptions>,
) -> Result<String> {
  // Deserializar IRs
  let schema_a: SourceSchema = serde_json::from_str(&ir_a_json)
    .map_err(|e| Error::from_reason(format!("Invalid IR A: {}", e)))?;
  
  let schema_b: SourceSchema = serde_json::from_str(&ir_b_json)
    .map_err(|e| Error::from_reason(format!("Invalid IR B: {}", e)))?;
  
  // Configurar opciones
  let mut config = CompareConfig::default();
  
  if let Some(opts) = options {
    if let Some(threshold) = opts.threshold {
      config.set_threshold(threshold);
    }
    
    if let Some(strategy) = opts.strategy {
      match strategy.as_str() {
        "structural" => config.enable_structural(),
        "semantic" => config.enable_semantic(),
        "hybrid" => config.enable_hybrid(),
        _ => {}
      }
    }
    
    if let Some(ignore_fields) = opts.ignore_fields {
      config.ignore_fields(ignore_fields);
    }
  }
  
  // Ejecutar comparación
  let result = compare(&schema_a, &schema_b, &config);
  
  // Serializar resultado
  serde_json::to_string_pretty(&result)
    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
}
```

**Output esperado**:
```json
{
  "matches": [...],
  "exclusives": [...],
  "conflicts": [...]
}
```

---

### Fase 4: Implementar `propose_resolution()` Real

**Objetivo**: Usar `audd_resolution::SuggestionEngine` para generar sugerencias.

```rust
use audd_resolution::{SuggestionEngine, ResolutionConfig};
use audd_compare::ComparisonResult;

#[napi]
pub async fn propose_resolution(
  diff_json: String,
  options: Option<ResolveOptions>,
) -> Result<String> {
  // Deserializar resultado de comparación
  let comparison: ComparisonResult = serde_json::from_str(&diff_json)
    .map_err(|e| Error::from_reason(format!("Invalid diff: {}", e)))?;
  
  // Configurar motor de sugerencias
  let mut config = ResolutionConfig::default();
  
  if let Some(opts) = options {
    if let Some(strategy) = opts.strategy {
      match strategy.as_str() {
        "conservative" => config.set_conservative(),
        "aggressive" => config.set_aggressive(),
        "balanced" => config.set_balanced(),
        _ => {}
      }
    }
    
    if let Some(prefer) = opts.prefer_source {
      config.prefer_source(&prefer);
    }
  }
  
  // Generar sugerencias
  let engine = SuggestionEngine::new(config);
  let suggestions = engine.generate_suggestions(&comparison);
  
  // Serializar
  serde_json::to_string_pretty(&suggestions)
    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
}
```

---

### Fase 5: Implementar `apply_resolution()` Real

**Objetivo**: Aplicar decisiones de resolución (requiere definir formato de salida).

```rust
use audd_resolution::{DecisionLog, Decision};

#[napi]
pub async fn apply_resolution(
  plan_json: String,
  options: Option<ApplyOptions>,
) -> Result<String> {
  // Deserializar plan (sugerencias + decisiones)
  let decision_log: DecisionLog = serde_json::from_str(&plan_json)
    .map_err(|e| Error::from_reason(format!("Invalid plan: {}", e)))?;
  
  let dry_run = options
    .as_ref()
    .and_then(|o| o.dry_run)
    .unwrap_or(false);
  
  let backup = options
    .as_ref()
    .and_then(|o| o.backup)
    .unwrap_or(true);
  
  if dry_run {
    // Solo validar, no aplicar
    let validation = decision_log.validate();
    return serde_json::to_string_pretty(&validation)
      .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)));
  }
  
  // TODO: Implementar lógica de apply real
  // - Generar schema unificado
  // - Exportar a archivo/DB según configuración
  
  let result = serde_json::json!({
    "applied": true,
    "backup_created": backup,
    "decisions_count": decision_log.decisions().len(),
  });
  
  Ok(result.to_string())
}
```

---

### Fase 6: Actualizar Tipos TypeScript

**Archivo**: `packages/audd-node/src/types.ts`

Alinear con las estructuras Rust reales:

```typescript
// Extraído de audd_ir::SourceSchema
export interface SourceSchema {
  source_name: string;
  source_type: string;
  entities: EntitySchema[];
  views?: View[];
  stored_procedures?: StoredProcedure[];
  triggers?: Trigger[];
  ir_version: string;
  metadata?: Record<string, unknown>;
}

export interface EntitySchema {
  entity_name: string;
  entity_type: string;
  fields: FieldSchema[];
  keys?: Key[];
  indexes?: Index[];
  metadata?: Record<string, unknown>;
}

export interface FieldSchema {
  field_name: string;
  canonical_type: CanonicalType;
  nullable: boolean;
  constraints?: Constraint[];
  metadata?: Record<string, unknown>;
}

export type CanonicalType = 
  | { type: 'boolean' }
  | { type: 'int32' }
  | { type: 'int64' }
  | { type: 'float32' }
  | { type: 'float64' }
  | { type: 'decimal'; precision: number; scale: number }
  | { type: 'string' }
  | { type: 'text' }
  | { type: 'binary' }
  | { type: 'date' }
  | { type: 'time' }
  | { type: 'datetime' }
  | { type: 'timestamp' }
  | { type: 'json' }
  | { type: 'uuid' }
  | { type: 'unknown'; original_type: string };

// Extraído de audd_compare::ComparisonResult
export interface ComparisonResult {
  matches: Match[];
  exclusives: Exclusive[];
  conflicts: Conflict[];
}

export interface Match {
  entity_name: string;
  field_name?: string;
  reason: MatchReason;
  score: number;
  index_a: number;
  index_b: number;
}

export type MatchReason = 
  | { reason: 'exact_name' }
  | { reason: 'normalized_name'; original_a: string; original_b: string }
  | { reason: 'similarity'; score: number }
  | { reason: 'semantic'; score: number; decision: string; details?: unknown };

// ... más tipos según audd_resolution
```

---

## 🔄 Flujo de Trabajo Actualizado

### Antes (Mock)
```
Node.js → N-API → api.rs (mock JSON) → Node.js
```

### Después (Real)
```
Node.js
  ↓
N-API (api.rs)
  ↓
audd_adapters_file/db → SourceSchema (audd_ir)
  ↓
audd_compare::compare() → ComparisonResult
  ↓
audd_resolution::SuggestionEngine → Suggestions
  ↓
JSON serializado → Node.js
```

---

## 📝 Checklist de Implementación

### Fase 1: Dependencias
- [ ] Actualizar `packages/audd-node/native/Cargo.toml`
- [ ] Agregar `audd_ir`, `audd_compare`, `audd_resolution`, `audd_adapters_*`
- [ ] Compilar con `pnpm build:native`
- [ ] Verificar que no hay errores de linking

### Fase 2: `build_ir()`
- [ ] Implementar lógica real con adapters
- [ ] Manejar `sourceType: "file"` con `load_schema_from_file()`
- [ ] Manejar `sourceType: "db"` con `create_connector()`
- [ ] Escribir tests de integración con archivos reales
- [ ] Validar que retorna `SourceSchema` correcto

### Fase 3: `compare()`
- [ ] Deserializar `SourceSchema` desde JSON
- [ ] Mapear `CompareOptions` a `CompareConfig`
- [ ] Ejecutar `audd_compare::compare()`
- [ ] Serializar `ComparisonResult` a JSON
- [ ] Tests con schemas reales

### Fase 4: `propose_resolution()`
- [ ] Deserializar `ComparisonResult`
- [ ] Mapear `ResolveOptions` a `ResolutionConfig`
- [ ] Ejecutar `SuggestionEngine::generate_suggestions()`
- [ ] Serializar sugerencias
- [ ] Tests con conflicts reales

### Fase 5: `apply_resolution()`
- [ ] Deserializar `DecisionLog`
- [ ] Implementar dry-run mode
- [ ] Implementar backup logic
- [ ] Aplicar decisiones (generar schema unificado)
- [ ] Tests end-to-end

### Fase 6: TypeScript
- [ ] Actualizar `types.ts` con estructuras reales
- [ ] Actualizar `index.ts` si es necesario
- [ ] Actualizar tests para usar tipos correctos
- [ ] Verificar que `pnpm test` pasa

### Fase 7: Documentación
- [ ] Actualizar README con ejemplos reales
- [ ] Documentar limitaciones (features no soportadas)
- [ ] Actualizar API.md con tipos correctos
- [ ] Ejemplos de uso end-to-end

---

## ⚠️ Consideraciones Técnicas

### 1. Manejo de Errores

Los crates AUDD usan `Result<T, E>`. Necesitamos mapear a errores N-API:

```rust
use audd_adapters_file::AdapterError;

fn map_adapter_error(e: AdapterError) -> Error {
  Error::from_reason(format!("Adapter error: {}", e))
}
```

### 2. Async/Await

Los adapters pueden ser síncronos o asíncronos:
- `audd_adapters_file`: Síncrono (lectura de archivos)
- `audd_adapters_db`: Asíncrono (queries a DB)

Usar `#[napi]` con `async fn` para todas las funciones.

### 3. Serialización

`SourceSchema` y otros tipos ya implementan `Serialize/Deserialize`. Simplemente usar:

```rust
schema.to_json()  // SourceSchema tiene este método
serde_json::to_string_pretty(&result)  // Para otros tipos
```

### 4. Features Opcionales

Algunos adapters tienen features opcionales:
```toml
audd_adapters_db = { path = "...", features = ["sqlite", "postgres", "mysql"] }
```

Evaluar cuáles incluir según necesidades.

---

## 🧪 Testing Strategy

### Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
  use super::*;
  
  #[tokio::test]
  async fn test_build_ir_csv() {
    let opts = BuildIROptions {
      source_type: "file".into(),
      format: "csv".into(),
      path: Some("../../tests/fixtures/users.csv".into()),
      config: None,
    };
    
    let result = build_ir(opts).await.unwrap();
    let schema: SourceSchema = serde_json::from_str(&result).unwrap();
    
    assert_eq!(schema.entities.len(), 1);
  }
}
```

### Integration Tests (TypeScript)

```typescript
describe('AUDD Engine - Real Implementation', () => {
  it('should build IR from CSV file', async () => {
    const engine = new AuddEngine();
    const ir = await engine.buildIR({
      source: {
        type: 'file',
        format: 'csv',
        path: './tests/fixtures/users.csv'
      }
    });
    
    expect(ir.entities).toBeDefined();
    expect(ir.entities[0].fields).toHaveLength(3);
  });
  
  it('should compare two schemas', async () => {
    const engine = new AuddEngine();
    const irA = await engine.buildIR({ /* ... */ });
    const irB = await engine.buildIR({ /* ... */ });
    
    const diff = await engine.compare(irA, irB);
    
    expect(diff.matches).toBeDefined();
    expect(diff.conflicts).toBeDefined();
  });
});
```

---

## 📊 Métricas de Éxito

- ✅ Compilación exitosa con dependencias reales
- ✅ Tests de Rust pasando (unit + integration)
- ✅ Tests de TypeScript pasando con datos reales
- ✅ Tipos TypeScript alineados con Rust
- ✅ Documentación actualizada
- ✅ Ejemplo end-to-end funcionando

---

## 🚀 Próximos Pasos Inmediatos

1. **Actualizar Cargo.toml** con dependencias a crates locales
2. **Compilar** para verificar que linking funciona
3. **Implementar `build_ir()`** con adapters reales
4. **Escribir test** con archivo CSV real
5. **Iterar** con `compare()` y `propose_resolution()`

---

## 📚 Referencias

- [AUDD IR Spec](../crates/audd_ir/README.md)
- [AUDD Compare Docs](../crates/audd_compare/README.md)
- [AUDD Resolution Docs](../crates/audd_resolution/README.md)
- [napi-rs Docs](https://napi.rs/)
