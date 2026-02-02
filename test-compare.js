const { AuddEngine } = require('./packages/audd-node/dist/index.js');
const path = require('path');

(async () => {
  const engine = new AuddEngine();

  // Paths a los datasets
  const datasetA = path.resolve(__dirname, 'packages/audd-node/fixtures/dataset-a.json');
  const datasetB = path.resolve(__dirname, 'packages/audd-node/fixtures/dataset-b.json');

  // Genera los IRs con la forma correcta
  const irA = await engine.buildIR({
    source: {
      type: 'file',
      format: 'json',
      path: datasetA
    }
  });

  const irB = await engine.buildIR({
    source: {
      type: 'file',
      format: 'json',
      path: datasetB
    }
  });

  console.log('IR A generado:', irA);
  console.log('IR B generado:', irB);
  
  // Compara los IRs
  const diff = await engine.compare(
    irA,
    irB,
    {
      threshold: 0.8,
      strategy: 'structural'
    }
  );

  console.log('Resultado de compare:', diff);
})();