// index.js
const express = require('express');
const { Worker } = require('worker_threads');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5002;
// URL al servicio-notificador dentro de la red Docker
const NOTIFICADOR_URL = process.env.NOTIFICADOR_URL || 'http://servicio-notificador:5003';

const app = express();
app.use(express.json());

app.post('/procesar', async (req, res) => {
  try {
    const { deviceId, payload } = req.body;
    if (!deviceId || !payload || typeof payload.complexity !== 'number') {
      return res.status(400).json({ status: 'ERROR', error: 'Faltan deviceId o payload.complexity' });
    }

    const taskId = uuidv4();
    // Definimos cuántos workers lanzamos (por ejemplo, 2 hilos en paralelo)
    const numWorkers = 2;
    const promises = [];

    for (let i = 0; i < numWorkers; i++) {
      promises.push(
        new Promise((resolve, reject) => {
          const worker = new Worker('./worker.js', {
            workerData: { complexity: payload.complexity, taskId, workerIndex: i }
          });

          worker.on('message', (msg) => resolve(msg));
          worker.on('error', (err) => reject(err));
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Worker detenido con código ${code}`));
            }
          });
        })
      );
    }

    // Esperamos que todos los workers terminen
    const resultados = await Promise.all(promises);

    // Preparamos el mensaje para el notificador
    const mensajeNotif = {
      deviceId,
      message: `Tarea ${taskId} completada. Detalles: ${resultados.join(' | ')}`
    };

    // Invocamos al servicio-notificador
    await axios.post(`${NOTIFICADOR_URL}/notify`, mensajeNotif);

    // Enviamos la respuesta al cliente (API Gateway)
    return res.json({
      status: 'OK',
      taskId,
      details: resultados
    });
  } catch (err) {
    console.error('Error en servicio-procesador:', err);
    return res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servicio-procesador escuchando en puerto ${PORT}`);
});
