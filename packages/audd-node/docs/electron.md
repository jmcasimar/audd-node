# Uso en Electron

Guía para integrar AUDD en aplicaciones Electron.

## Instalación

```bash
pnpm add @audd/node
```

## Arquitectura Recomendada

AUDD debe ejecutarse en el **Main Process** de Electron por dos razones:

1. Acceso nativo a Node.js APIs (archivos, bases de datos)
2. Operaciones pesadas no deben bloquear el UI

Usa IPC (Inter-Process Communication) para comunicar Renderer → Main.

## Setup

### Main Process (`main.js`)

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const { AuddEngine } = require('@audd/node');

// Crear instancia global del engine
const auddEngine = new AuddEngine();

// Handlers IPC
ipcMain.handle('audd:buildIR', async (event, options) => {
  try {
    const ir = await auddEngine.buildIR(options);
    return { success: true, data: ir };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }
});

ipcMain.handle('audd:compare', async (event, irA, irB, options) => {
  try {
    const diff = await auddEngine.compare(irA, irB, options);
    return { success: true, data: diff };
  } catch (error) {
    return { success: false, error: error.toJSON() };
  }
});

ipcMain.handle('audd:proposeResolution', async (event, diff, options) => {
  try {
    const plan = await auddEngine.proposeResolution(diff, options);
    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error: error.toJSON() };
  }
});

ipcMain.handle('audd:applyResolution', async (event, plan, options) => {
  try {
    const result = await auddEngine.applyResolution(plan, options);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.toJSON() };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

### Preload Script (`preload.js`)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('audd', {
  buildIR: (options) => ipcRenderer.invoke('audd:buildIR', options),
  compare: (irA, irB, options) => ipcRenderer.invoke('audd:compare', irA, irB, options),
  proposeResolution: (diff, options) => ipcRenderer.invoke('audd:proposeResolution', diff, options),
  applyResolution: (plan, options) => ipcRenderer.invoke('audd:applyResolution', plan, options),
});
```

### Renderer Process (`renderer.js` o React/Vue)

```javascript
// Vanilla JS
async function compareDatasets() {
  try {
    // Build IR A
    const resultA = await window.audd.buildIR({
      source: {
        type: 'file',
        format: 'json',
        path: '/path/to/dataset-a.json'
      }
    });
    
    if (!resultA.success) {
      console.error('Error:', resultA.error);
      return;
    }
    
    // Build IR B
    const resultB = await window.audd.buildIR({
      source: {
        type: 'file',
        format: 'json',
        path: '/path/to/dataset-b.json'
      }
    });
    
    // Compare
    const diffResult = await window.audd.compare(
      resultA.data,
      resultB.data,
      { threshold: 0.9 }
    );
    
    if (diffResult.success) {
      const diff = JSON.parse(diffResult.data);
      console.log('Diferencias encontradas:', diff.changes);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### React Example

```tsx
import { useState } from 'react';

// Type definitions para window.audd
declare global {
  interface Window {
    audd: {
      buildIR: (options: any) => Promise<any>;
      compare: (irA: string, irB: string, options?: any) => Promise<any>;
      proposeResolution: (diff: string, options?: any) => Promise<any>;
      applyResolution: (plan: string, options?: any) => Promise<any>;
    };
  }
}

function CompareView() {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const irA = await window.audd.buildIR({
        source: { type: 'file', format: 'json', path: filePathA }
      });
      
      const irB = await window.audd.buildIR({
        source: { type: 'file', format: 'json', path: filePathB }
      });
      
      const result = await window.audd.compare(irA.data, irB.data);
      
      if (result.success) {
        setDiff(JSON.parse(result.data));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparando...' : 'Comparar'}
      </button>
      {diff && <DiffViewer diff={diff} />}
    </div>
  );
}
```

## Manejo de Rutas

En Electron, las rutas deben ser absolutas. Usa `path` de Node.js:

```javascript
// En el main process
const path = require('path');

ipcMain.handle('audd:buildIRFromFile', async (event, relativePath) => {
  const absolutePath = path.join(app.getPath('userData'), relativePath);
  
  return auddEngine.buildIR({
    source: {
      type: 'file',
      format: 'json',
      path: absolutePath
    }
  });
});
```

## Progreso y Cancelación

Para operaciones largas, considera implementar progreso:

```javascript
// Main process
ipcMain.handle('audd:compareWithProgress', async (event, irA, irB) => {
  // Simular progreso (AUDD core debería emitir eventos reales)
  event.sender.send('audd:progress', { step: 'parsing', progress: 0.2 });
  
  const diff = await auddEngine.compare(irA, irB);
  
  event.sender.send('audd:progress', { step: 'done', progress: 1.0 });
  
  return { success: true, data: diff };
});

// Renderer
window.audd.onProgress = (callback) => {
  ipcRenderer.on('audd:progress', (event, data) => callback(data));
};
```

## Empaquetado

Al empaquetar con `electron-builder`, asegúrate de incluir los binarios nativos:

**electron-builder.json:**
```json
{
  "files": [
    "dist/**/*",
    "node_modules/**/*"
  ],
  "asarUnpack": [
    "node_modules/@audd/node/native/*.node"
  ],
  "extraFiles": [
    {
      "from": "node_modules/@audd/node/native",
      "to": "Resources/native",
      "filter": ["*.node"]
    }
  ]
}
```

## Troubleshooting

### Error: "Cannot find module '*.node'"

Verifica que los binarios nativos estén en el path correcto:

```javascript
const path = require('path');
const isDev = require('electron-is-dev');

const nativeBindingPath = isDev
  ? path.join(__dirname, '../node_modules/@audd/node/native/index.node')
  : path.join(process.resourcesPath, 'native/index.node');
```

### Rebuild en desarrollo

Si usas versiones diferentes de Node/Electron durante desarrollo:

```bash
# NO es necesario con N-API (napi-rs)
# Los binarios son compatibles entre versiones de Node
```

Una ventaja de usar N-API es que **no necesitas** `electron-rebuild` en desarrollo.

## Seguridad

- ✅ Usa `contextIsolation: true`
- ✅ Usa `nodeIntegration: false`
- ✅ Valida inputs en el main process
- ✅ No expongas toda la API de AUDD, solo lo necesario
- ❌ Nunca permitas al renderer ejecutar código arbitrario

## Performance

- Operaciones pesadas ya son asíncronas (no bloquean el event loop)
- Para archivos muy grandes (>100MB), considera:
  - Mostrar progreso en UI
  - Permitir cancelación
  - Procesar en chunks si es posible
