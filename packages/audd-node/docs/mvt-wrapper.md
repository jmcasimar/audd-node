# MVT - Minimum Viable Test

Documento de pruebas mínimas para validar el wrapper AUDD Node.js.

## Objetivo

Validar que el wrapper funciona correctamente end-to-end con un conjunto mínimo de tests repetibles.

## Prerequisitos

- Node.js ≥ 18.0.0
- Rust ≥ 1.70.0
- pnpm ≥ 8.0.0

## Setup

```bash
# Instalar dependencias
pnpm install

# Compilar
pnpm build
```

## Tests Automatizados

### 1. Unit Tests

Validan la lógica del SDK TypeScript sin dependencia del addon nativo.

```bash
pnpm test:unit
```

**Casos cubiertos:**
- ✅ Validación de inputs
- ✅ Manejo de errores
- ✅ Serialización/deserialización
- ✅ Helpers y utilidades

### 2. Integration Tests

Validan el flujo completo con el addon nativo.

```bash
pnpm test:integration
```

**Casos cubiertos:**
- ✅ Build IR desde JSON
- ✅ Build IR desde CSV
- ✅ Build IR desde SQLite
- ✅ Compare entre dos IRs
- ✅ Propose resolution
- ✅ Apply resolution (dry run)
- ✅ Validación de IR

### 3. Smoke Tests

Validan que el addon nativo carga correctamente.

```bash
pnpm test
```

**Casos cubiertos:**
- ✅ Addon se carga sin errores
- ✅ `version()` retorna string
- ✅ `ping()` retorna "pong"

## Tests Manuales

### Test 1: Archivo JSON → IR

**Input:** `tests/integration/fixtures/dataset-a.json`

**Comando:**
```bash
node -e "
const { AuddEngine } = require('./dist/index.js');
const engine = new AuddEngine();

engine.buildIR({
  source: {
    type: 'file',
    format: 'json',
    path: './tests/integration/fixtures/dataset-a.json'
  }
}).then(ir => {
  const parsed = JSON.parse(ir);
  console.log('✅ IR generado');
  console.log('Version:', parsed.version);
  console.log('Source:', parsed.source);
  console.log('Rows:', parsed.metadata.rows);
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"
```

**Criterio de éxito:**
- IR se genera sin errores
- Contiene campos: `version`, `source`, `schema`, `data`, `metadata`

### Test 2: CSV → IR

**Input:** `tests/integration/fixtures/dataset.csv`

**Comando:**
```bash
node -e "
const { AuddEngine } = require('./dist/index.js');
const engine = new AuddEngine();

engine.buildIR({
  source: {
    type: 'file',
    format: 'csv',
    path: './tests/integration/fixtures/dataset.csv',
    hasHeader: true,
    delimiter: ','
  }
}).then(ir => {
  console.log('✅ IR desde CSV generado');
  console.log(JSON.parse(ir).metadata);
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"
```

**Criterio de éxito:**
- IR se genera sin errores
- Metadata refleja número correcto de filas

### Test 3: Comparación

**Inputs:** 
- `dataset-a.json`
- `dataset-b.json`

**Comando:**
```bash
node -e "
const { AuddEngine } = require('./dist/index.js');
const engine = new AuddEngine();

(async () => {
  const irA = await engine.buildIR({
    source: { type: 'file', format: 'json', path: './tests/integration/fixtures/dataset-a.json' }
  });
  
  const irB = await engine.buildIR({
    source: { type: 'file', format: 'json', path: './tests/integration/fixtures/dataset-b.json' }
  });
  
  const diff = await engine.compare(irA, irB, { threshold: 0.8 });
  
  const parsed = JSON.parse(diff);
  console.log('✅ Comparación exitosa');
  console.log('Changes:', parsed.changes);
  console.log('Similarity:', parsed.statistics.similarity);
})().catch(err => console.error('❌ Error:', err.message));
"
```

**Criterio de éxito:**
- Diff se genera sin errores
- Contiene sección `changes` con `added`, `removed`, `modified`
- Estadísticas de similitud presentes

### Test 4: Flujo Completo

**Objetivo:** Validar IR → Compare → Resolve → Apply

**Comando:**
```bash
node -e "
const { AuddEngine } = require('./dist/index.js');
const engine = new AuddEngine();

(async () => {
  // 1. Build IRs
  const irA = await engine.buildIR({
    source: { type: 'file', format: 'json', path: './tests/integration/fixtures/dataset-a.json' }
  });
  const irB = await engine.buildIR({
    source: { type: 'file', format: 'json', path: './tests/integration/fixtures/dataset-b.json' }
  });
  console.log('✅ Step 1: IRs construidos');
  
  // 2. Compare
  const diff = await engine.compare(irA, irB);
  console.log('✅ Step 2: Comparación completada');
  
  // 3. Propose
  const plan = await engine.proposeResolution(diff, { strategy: 'balanced' });
  console.log('✅ Step 3: Plan de resolución generado');
  
  // 4. Apply (dry run)
  const result = await engine.applyResolution(plan, { dryRun: true });
  const parsed = JSON.parse(result);
  console.log('✅ Step 4: Aplicación (dry run) completada');
  console.log('Results:', parsed.results);
})().catch(err => console.error('❌ Error:', err));
"
```

**Criterio de éxito:**
- Todos los pasos se completan sin errores
- Cada paso produce output válido

### Test 5: Repetibilidad

**Objetivo:** Validar que dos ejecuciones consecutivas producen mismo resultado

**Comando:**
```bash
node -e "
const { AuddEngine } = require('./dist/index.js');
const engine = new AuddEngine();

(async () => {
  const options = {
    source: { type: 'file', format: 'json', path: './tests/integration/fixtures/dataset-a.json' }
  };
  
  const ir1 = await engine.buildIR(options);
  const ir2 = await engine.buildIR(options);
  
  const parsed1 = JSON.parse(ir1);
  const parsed2 = JSON.parse(ir2);
  
  // Comparar sin timestamps
  delete parsed1.metadata.created_at;
  delete parsed2.metadata.created_at;
  
  const same = JSON.stringify(parsed1) === JSON.stringify(parsed2);
  
  console.log(same ? '✅ Repetible: mismo output' : '❌ No repetible: outputs difieren');
})().catch(err => console.error('❌ Error:', err));
"
```

**Criterio de éxito:**
- Dos ejecuciones producen output idéntico (excepto timestamps)

## Criterios de Aprobación

Para considerar el MVT exitoso, **TODOS** los siguientes deben cumplirse:

- [ ] ✅ Addon nativo se compila sin errores
- [ ] ✅ Todos los unit tests pasan
- [ ] ✅ Todos los integration tests pasan
- [ ] ✅ Test manual 1 (JSON → IR) exitoso
- [ ] ✅ Test manual 2 (CSV → IR) exitoso
- [ ] ✅ Test manual 3 (Comparación) exitoso
- [ ] ✅ Test manual 4 (Flujo completo) exitoso
- [ ] ✅ Test manual 5 (Repetibilidad) exitoso
- [ ] ✅ Errores se manejan correctamente con códigos estables
- [ ] ✅ No hay memory leaks evidentes (ejecutar con `--expose-gc`)

## Ejecución Completa

Para ejecutar todo el MVT:

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Tests automatizados
pnpm test

# Tests manuales (ejecutar scripts uno por uno)
# Ver sección "Tests Manuales" arriba
```

## Troubleshooting

### Error: Cannot find module '*.node'

```bash
# Verificar que se compiló el addon
ls -la packages/audd-node/native/*.node

# Re-compilar
pnpm build:native
```

### Tests fallan con timeout

Aumentar timeout en `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 segundos
  }
});
```

### Errores de Rust

```bash
# Verificar versión de Rust
rustc --version  # Debe ser >= 1.70.0

# Limpiar y re-compilar
cargo clean
pnpm build:native
```

## Reporte de Resultados

Después de ejecutar el MVT, documentar:

1. ✅/❌ Estado de cada test
2. Tiempo de ejecución total
3. Errores encontrados (si los hay)
4. Plataforma de prueba (OS, Node version, Rust version)

**Template:**

```
# MVT Results - [Fecha]

## Entorno
- OS: Windows 11 / macOS 14 / Ubuntu 22.04
- Node: v20.11.0
- Rust: 1.75.0
- pnpm: 8.15.0

## Tests Automatizados
- Unit tests: ✅ 15/15 passed
- Integration tests: ✅ 8/8 passed

## Tests Manuales
- Test 1 (JSON → IR): ✅
- Test 2 (CSV → IR): ✅
- Test 3 (Comparación): ✅
- Test 4 (Flujo completo): ✅
- Test 5 (Repetibilidad): ✅

## Tiempo Total
~5 minutos

## Conclusión
✅ MVT PASSED - Wrapper listo para uso
```
