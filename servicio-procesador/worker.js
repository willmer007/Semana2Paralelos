/*
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
*/
// servicio-procesador/worker.js
const { parentPort, workerData } = require('worker_threads');

// Destructure
const { workerIndex, complexity, taskId } = workerData;

// Simular carga de CPU
function heavyComputation(c) {
  const iterations = Math.floor(c * 1e7);
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += i % 10;
  }
  return sum;
}

const result = heavyComputation(complexity);
const message = `Worker ${workerIndex} de tarea ${taskId} result=${result}`;
parentPort.postMessage(message);
