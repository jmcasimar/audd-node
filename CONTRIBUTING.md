# Contributing to AUDD Node.js Wrapper

¡Gracias por tu interés en contribuir! 🎉

## Código de Conducta

Este proyecto adhiere a un código de conducta de respeto mutuo. Al participar, te comprometes a mantener un ambiente constructivo.

## ¿Cómo Contribuir?

### Reportar Bugs

1. Verifica que el bug no esté ya reportado en [Issues](https://github.com/jmcasimar/audd-node/issues)
2. Crea un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Versión de Node, OS, y audd-node
   - Logs o screenshots si aplica

**Template:**
```markdown
## Bug Description
[Descripción clara del problema]

## Steps to Reproduce
1. ...
2. ...

## Expected Behavior
[Qué debería pasar]

## Actual Behavior
[Qué pasa actualmente]

## Environment
- OS: [Windows 11 / macOS 14 / Ubuntu 22.04]
- Node: [v20.11.0]
- audd-node: [0.1.0]
- Rust: [1.75.0]
```

### Proponer Features

1. Crea un issue con tag `enhancement`
2. Describe el caso de uso
3. Propón diseño de API (si aplica)
4. Discute con mantainers antes de implementar

### Pull Requests

1. **Fork** el repo
2. **Crea una rama** desde `develop`:
   ```bash
   git checkout -b feature/mi-feature
   # o
   git checkout -b fix/mi-fix
   ```

3. **Implementa los cambios**:
   - Sigue el estilo de código existente
   - Agrega tests para nueva funcionalidad
   - Actualiza documentación si es necesario

4. **Commits**:
   - Usa mensajes descriptivos
   - Formato recomendado: [Conventional Commits](https://www.conventionalcommits.org/)
   ```
   feat: add CSV adapter with custom delimiter support
   fix: handle invalid JSON in buildIR
   docs: update API reference for compare options
   test: add integration test for SQLite adapter
   ```

5. **Tests**:
   ```bash
   pnpm lint
   pnpm test
   ```

6. **Push y PR**:
   ```bash
   git push origin feature/mi-feature
   ```
   - Abre PR hacia `develop` (no `main`)
   - Describe qué cambia y por qué
   - Referencia issues relacionados

## Setup de Desarrollo

### Prerequisitos

- Node.js ≥ 18.0.0
- Rust ≥ 1.70.0
- pnpm ≥ 8.0.0

### Instalación

```bash
# Clonar
git clone https://github.com/jmcasimar/audd-node.git
cd audd-node

# Instalar dependencias
pnpm install

# Compilar
pnpm build

# Tests
pnpm test
```

### Estructura

```
audd-node/
├── packages/
│   └── audd-node/
│       ├── src/           # SDK TypeScript
│       ├── native/        # Addon Rust
│       ├── tests/         # Tests
│       └── docs/          # Documentación
└── .github/workflows/     # CI/CD
```

### Flujo de Desarrollo

1. Hacer cambios en `src/` (TS) o `native/` (Rust)
2. Compilar:
   ```bash
   pnpm build        # Todo
   pnpm build:ts     # Solo TS
   pnpm build:native # Solo Rust
   ```
3. Tests:
   ```bash
   pnpm test              # Todos
   pnpm test:unit         # Unit
   pnpm test:integration  # Integration
   pnpm test:watch        # Watch mode
   ```
4. Lint:
   ```bash
   pnpm lint
   pnpm format
   ```

### Debug

#### TypeScript
Usar breakpoints en VS Code o:
```bash
node --inspect-brk ./dist/index.js
```

#### Rust
Agregar prints:
```rust
println!("Debug: {:?}", variable);
```

Compilar en modo debug:
```bash
pnpm build:debug
```

## Lineamientos de Código

### TypeScript

- **Estilo**: Prettier + ESLint (config ya incluida)
- **Tipos**: Evitar `any`, usar tipos explícitos
- **Errores**: Siempre usar `AuddError` con código estable
- **Async**: Preferir `async/await` sobre callbacks

**Ejemplo:**
```typescript
// ✅ Bien
async function buildIR(options: BuildIROptions): Promise<IR> {
  this.validateOptions(options);
  
  try {
    const result = await native.buildIr(options);
    return result;
  } catch (error) {
    throw AuddError.fromNativeError(error);
  }
}

// ❌ Mal
function buildIR(options: any, callback: Function) {
  // ...
}
```

### Rust

- **Estilo**: `cargo fmt` automático
- **Errores**: Usar `anyhow` o `thiserror`
- **Async**: Usar Tokio para operaciones I/O
- **Exports**: Todo `#[napi]` debe tener docstring

**Ejemplo:**
```rust
/// Construye IR desde una fuente
///
/// # Arguments
/// * `options` - Opciones de construcción
///
/// # Returns
/// JSON string con IR
#[napi]
pub async fn build_ir(options: BuildIROptions) -> Result<String> {
  // ...
}
```

### Tests

- **Unit tests**: Validar lógica aislada (sin addon)
- **Integration tests**: Validar flujo completo (con addon)
- **Fixtures**: Usar datos pequeños y versionados
- **Assertions**: Descriptivas y específicas

**Ejemplo:**
```typescript
describe('AuddEngine', () => {
  it('should throw on missing source type', async () => {
    await expect(
      engine.buildIR({ source: { format: 'json' } })
    ).rejects.toThrow('Missing source type');
  });
});
```

## Versionado

Usamos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles en API
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Bug fixes compatibles

Ejemplos:
- `0.1.0` → `0.2.0`: Nuevo adaptador (minor)
- `0.1.0` → `0.1.1`: Fix en validación (patch)
- `0.9.0` → `1.0.0`: API estable, primera versión (major)

## Release Process

1. Actualizar `CHANGELOG.md`
2. Bump versión en `package.json`
3. Tag release: `git tag v0.1.0`
4. Push: `git push --tags`
5. CI automáticamente:
   - Compila prebuilds
   - Publica a npm
   - Crea GitHub release

## Preguntas

- **Slack/Discord**: [Link al workspace]
- **Issues**: Para bugs y features
- **Email**: maintainers@audd.dev

## Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la misma licencia del proyecto (MIT).

---

¡Gracias por hacer AUDD mejor! 🚀
