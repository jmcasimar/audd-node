// test-audd.js
const { AuddEngine } = require('./packages/audd-node/dist/index.js');

(async () => {
  // Prueba simple: ping
  const pong = await AuddEngine.ping();
  console.log('Ping:', pong);

  // Crea una instancia de AuddEngine
  const engine = new AuddEngine();

  // Prueba buildIR usando tu fixture
  const fs = require('fs');
  const path = require('path');
  const datasetPath = path.resolve(__dirname, 'packages/audd-node/fixtures/dataset-b.json');
  const ir = await engine.buildIR({
    source: {
      type: 'file',
      format: 'json',
      path: datasetPath
    }
  });
  console.log('IR generado:', ir);
})();