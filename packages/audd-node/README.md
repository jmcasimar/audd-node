# @audd/node

Node.js wrapper para AUDD (Automated Universal Data Diff).

## Instalación

```bash
npm install @audd/node
# o
pnpm add @audd/node
# o
yarn add @audd/node
```

## Inicio Rápido

```typescript
import { AuddEngine } from '@audd/node';

const engine = new AuddEngine();

// Construir IR desde archivo JSON
const irA = await engine.buildIR({
  source: {
    type: 'file',
    format: 'json',
    path: './data-a.json'
  }
});

const irB = await engine.buildIR({
  source: {
    type: 'file',
    format: 'json',
    path: './data-b.json'
  }
});

// Comparar
const diff = await engine.compare(irA, irB);

// Proponer resolución
const plan = await engine.proposeResolution(diff);

// Aplicar (dry run)
const result = await engine.applyResolution(plan, { dryRun: true });
```

## Características

- ✅ **Bindings nativos** (Rust + N-API) para máximo rendimiento
- ✅ **TypeScript** con tipos completos
- ✅ **Asíncrono** (no bloquea el event loop)
- ✅ **Adaptadores** para JSON, CSV, SQLite, MySQL, PostgreSQL
- ✅ **Manejo de errores** normalizado con códigos estables
- ✅ **Cross-platform** (Windows, macOS, Linux)
- ✅ **Compatible con Electron**

## Documentación

- [Referencia de API](./docs/api.md)
- [Uso en Electron](./docs/electron.md)
- [MVT - Tests Mínimos](./docs/mvt-wrapper.md)

## Licencia

MIT
