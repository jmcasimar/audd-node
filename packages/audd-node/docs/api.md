# Referencia de API - AUDD Node.js

## AuddEngine

Clase principal para interactuar con el motor AUDD.

### Constructor

```typescript
const engine = new AuddEngine();
```

### Métodos Estáticos

#### `getVersion(): string`

Retorna la versión del addon nativo.

```typescript
const version = AuddEngine.getVersion();
console.log(version); // "0.1.0"
```

#### `ping(): string`

Función de prueba que retorna "pong".

```typescript
const result = AuddEngine.ping();
console.log(result); // "pong"
```

### Métodos de Instancia

#### `buildIR(options: BuildIROptions): Promise<IR>`

Construye una Representación Intermedia (IR) desde una fuente de datos.

**Parámetros:**
- `options.source`: Configuración de la fuente (archivo, DB, memoria)
- `options.config`: Configuración adicional (opcional)

**Retorna:** Promise con el IR en formato JSON string

**Ejemplo - Archivo JSON:**
```typescript
const ir = await engine.buildIR({
  source: {
    type: 'file',
    format: 'json',
    path: './data/users.json'
  }
});
```

**Ejemplo - CSV:**
```typescript
const ir = await engine.buildIR({
  source: {
    type: 'file',
    format: 'csv',
    path: './data/users.csv',
    delimiter: ',',
    hasHeader: true
  }
});
```

**Ejemplo - SQLite:**
```typescript
const ir = await engine.buildIR({
  source: {
    type: 'db',
    format: 'sqlite',
    path: './database.db',
    table: 'users'
  }
});
```

#### `compare(irA: IR, irB: IR, options?: CompareOptions): Promise<Diff>`

Compara dos IRs y retorna las diferencias.

**Parámetros:**
- `irA`: IR del dataset A (JSON string)
- `irB`: IR del dataset B (JSON string)
- `options`: Opciones de comparación (opcional)
  - `threshold`: Umbral de similitud (0.0 - 1.0, default: 0.8)
  - `strategy`: Estrategia ("structural" | "semantic" | "hybrid", default: "structural")
  - `ignoreFields`: Campos a ignorar

**Retorna:** Promise con el diff en formato JSON string

**Ejemplo:**
```typescript
const diff = await engine.compare(irA, irB, {
  threshold: 0.9,
  strategy: 'structural',
  ignoreFields: ['updated_at', 'metadata']
});
```

#### `proposeResolution(diff: Diff, options?: ResolveOptions): Promise<Plan>`

Genera un plan de resolución desde un diff.

**Parámetros:**
- `diff`: Diff (JSON string)
- `options`: Opciones de resolución (opcional)
  - `strategy`: Estrategia ("conservative" | "aggressive" | "balanced", default: "balanced")
  - `preferSource`: Fuente preferida ("a" | "b" | "merge", default: "merge")

**Retorna:** Promise con el plan en formato JSON string

**Ejemplo:**
```typescript
const plan = await engine.proposeResolution(diff, {
  strategy: 'conservative',
  preferSource: 'a'
});
```

#### `applyResolution(plan: Plan, options?: ApplyOptions): Promise<ApplyResult>`

Aplica un plan de resolución.

**Parámetros:**
- `plan`: Plan (JSON string)
- `options`: Opciones de aplicación (opcional)
  - `dryRun`: Modo prueba sin aplicar cambios (default: false)
  - `backup`: Generar backup antes de aplicar (default: true)

**Retorna:** Promise con el resultado en formato JSON string

**Ejemplo:**
```typescript
// Dry run primero
const dryResult = await engine.applyResolution(plan, { 
  dryRun: true 
});

// Si todo OK, aplicar cambios reales
const result = await engine.applyResolution(plan, { 
  dryRun: false,
  backup: true
});
```

#### `validateIR(ir: IR): Promise<ValidationResult>`

Valida la estructura de un IR.

**Parámetros:**
- `ir`: IR a validar (JSON string)

**Retorna:** Promise con `{ ok: boolean, errors: string[] }`

**Ejemplo:**
```typescript
const validation = await engine.validateIR(ir);
if (!validation.ok) {
  console.error('Errores:', validation.errors);
}
```

## Adaptadores

### FileAdapterFactory

Factory para crear adaptadores de archivos.

```typescript
import { AuddEngine, FileAdapterFactory } from '@audd/node';

const engine = new AuddEngine();
const adapter = FileAdapterFactory.create(engine, 'json');
```

### JsonFileAdapter

```typescript
const adapter = new JsonFileAdapter(engine);
const ir = await adapter.buildIR('./data.json', 'utf-8');
```

### CsvFileAdapter

```typescript
const adapter = new CsvFileAdapter(engine);
const ir = await adapter.buildIR('./data.csv', {
  encoding: 'utf-8',
  delimiter: ',',
  hasHeader: true
});
```

### DbAdapterFactory

Factory para crear adaptadores de bases de datos.

```typescript
const adapter = DbAdapterFactory.create(engine, 'sqlite');
```

### SQLiteAdapter

```typescript
const adapter = new SQLiteAdapter(engine);
const ir = await adapter.buildIR({
  path: './database.db',
  table: 'users'
});

// Verificar conexión
const canConnect = await adapter.checkConnection('./database.db');
```

### MySQLAdapter

```typescript
const adapter = new MySQLAdapter(engine);
const ir = await adapter.buildIR({
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  table: 'users'
});
```

### PostgreSQLAdapter

```typescript
const adapter = new PostgreSQLAdapter(engine);
const ir = await adapter.buildIR({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  table: 'users'
});
```

## Manejo de Errores

Todos los errores lanzan `AuddError` con estructura normalizada:

```typescript
try {
  await engine.buildIR({ /* ... */ });
} catch (error) {
  if (error instanceof AuddError) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}
```

### Códigos de Error

- `INVALID_INPUT`: Entrada inválida
- `UNSUPPORTED_SOURCE`: Tipo de fuente no soportada
- `UNSUPPORTED_FORMAT`: Formato no soportado
- `DB_CONNECTION_FAILED`: Fallo en conexión a BD
- `IO_ERROR`: Error de E/S
- `INTERNAL_ERROR`: Error interno
- `CANCELLED`: Operación cancelada
- `TIMEOUT`: Timeout de operación
- `JSON_ERROR`: Error de JSON

### Helpers de Error

```typescript
import { createError } from '@audd/node';

throw createError.invalidInput('Campo requerido', { field: 'name' });
throw createError.unsupportedFormat('xml');
throw createError.timeout('buildIR');
```

## Tipos TypeScript

Todos los tipos están completamente tipados. Importa los que necesites:

```typescript
import type {
  SourceConfig,
  FileSourceConfig,
  DbSourceConfig,
  BuildIROptions,
  CompareOptions,
  ResolveOptions,
  ApplyOptions,
  IR,
  Diff,
  Plan,
  ApplyResult,
  ValidationResult,
  ErrorCode
} from '@audd/node';
```
