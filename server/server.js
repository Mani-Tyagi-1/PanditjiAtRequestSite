// server.js
// This file is the entry point for PM2 on the cloud server.
// It matches the 'script: "server.js"' configuration.
// It bypasses the Node 20.20+ ESM cycle bug by manually requiring ts-node
// in CommonJS mode and explicitly pointing to the main application.

// require('ts-node').register({
//   transpileOnly: true,
//   compilerOptions: {
//     module: "CommonJS"
//   }
// });

// require('./src/index.ts');
