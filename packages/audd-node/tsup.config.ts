import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [/\.node$/], // Marcar todos los archivos .node como externos
  noExternal: [], // No procesar módulos nativos
  skipNodeModulesBundle: true,
});
