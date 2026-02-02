# AUDD Node.js Wrapper

Wrapper de Node.js para el motor AUDD (Algoritmo de Unificación Dinámica de Datos), implementado en Rust con bindings N-API.

## 🎯 Objetivo

Proporcionar una API estable y asíncrona para ejecutar operaciones AUDD desde entornos Node.js y Electron:
- **IR**: Construcción de representación intermedia desde múltiples fuentes
- **Compare**: Comparación estructural entre datasets
- **Resolve**: Generación y aplicación de planes de resolución

## 📦 Estructura del Proyecto

```
audd-node/
├── packages/
│   └── audd-node/          # Paquete principal
│       ├── src/            # SDK TypeScript
│       ├── native/         # Addon Rust (N-API)
│       └── tests/          # Tests unitarios e integración
├── .github/workflows/      # CI/CD
└── README.md
```

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0
- Rust ≥ 1.70.0 (con cargo)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/jmcasimar/audd-node.git
cd audd-node

# Instalar dependencias
pnpm install

# Compilar el proyecto
pnpm build

# Ejecutar tests
pnpm test
```

### Uso Básico

```typescript
import { AuddEngine } from '@audd/node';

// Inicializar motor
const engine = new AuddEngine();

// Construir IR desde archivo JSON
const irA = await engine.buildIR({
  type: 'file',
  format: 'json',
  path: './data/dataset-a.json'
});

// Construir IR desde SQLite
const irB = await engine.buildIR({
  type: 'db',
  format: 'sqlite',
  path: './data/database.db',
  table: 'users'
});

// Comparar
const diff = await engine.compare(irA, irB, {
  threshold: 0.8
});

// Proponer resolución
const plan = await engine.proposeResolution(diff, {
  strategy: 'conservative'
});

// Aplicar resolución
const result = await engine.applyResolution(plan);
```

## 📖 Documentación

- [API Reference](./packages/audd-node/docs/api.md)
- [Adaptadores](./packages/audd-node/docs/adapters.md)
- [Manejo de Errores](./packages/audd-node/docs/errors.md)
- [Uso en Electron](./packages/audd-node/docs/electron.md)

## 🧪 Testing

```bash
# Tests unitarios
pnpm test:unit

# Tests de integración
pnpm test:integration

# Coverage
pnpm test:coverage
```

## 🛠️ Desarrollo

```bash
# Modo desarrollo (watch)
pnpm dev

# Lint
pnpm lint

# Format
pnpm format

# Limpiar builds
pnpm clean
```

## 🤝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para lineamientos de contribución.

## 📄 Licencia

MIT © 2026

## 🔗 Enlaces

- [AUDD Core](https://github.com/jmcasimar/audd)
- [Documentación](https://audd.growventa.com)
- [Roadmap](./ROADMAP.md)
