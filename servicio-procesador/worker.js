// worker.js
const { parentPort, workerData } = require('worker_threads');

// Simula un trabajo que consume CPU (por ejemplo, un bucle intensivo).
function trabajoIntensivo(data) {
  const { complexity, taskId, workerIndex } = data;
  let acc = 0;
  // Simulación: loop que recorre hasta complexity * 1e6
  for (let i = 0; i < complexity * 1e6; i++) {
    acc += Math.sqrt(i);
  }
  return `Worker ${workerIndex} de tarea ${taskId} result=${acc.toFixed(2)}`;
}

// Ejecuta el trabajo y envía el resultado al hilo principal
const resultado = trabajoIntensivo(workerData);
parentPort.postMessage(resultado);
