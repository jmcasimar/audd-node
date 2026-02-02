/**
 * Binding nativo - carga el addon específico de la plataforma
 */

/* eslint-disable @typescript-eslint/no-var-requires */

// napi-rs genera archivos con nombres específicos de plataforma
// Intentamos cargar el correcto según el sistema operativo
let nativeBinding: any;

try {
  // El archivo generado por napi-rs está en la raíz del paquete
  nativeBinding = require('../audd-native.win32-x64-msvc.node');
} catch (loadError) {
  try {
    nativeBinding = require('../audd-native.darwin-x64.node');
  } catch {
    try {
      nativeBinding = require('../audd-native.darwin-arm64.node');
    } catch {
      try {
        nativeBinding = require('../audd-native.linux-x64-gnu.node');
      } catch {
        try {
          nativeBinding = require('../audd-native.linux-arm64-gnu.node');
        } catch (finalError) {
          throw new Error(
            `No se pudo cargar el addon nativo de AUDD para esta plataforma. ` +
              `Error original: ${(loadError as Error).message}`
          );
        }
      }
    }
  }
}

export const native = nativeBinding;
