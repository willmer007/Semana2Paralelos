/*
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

// servicio-procesador/index.js
const express = require('express');
const { Worker } = require('worker_threads');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5002;

// MIDDLEWARE que SOLO corre express.json() si es POST Y tiene Content-Type application/json
function onlyJsonBody(req, res, next) {
  // Solo queremos parsear JSON si es POST a /procesar
  if (req.method === 'POST' && req.path === '/procesar') {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      // Llamamos a express.json() manualmente
      return express.json()(req, res, next);
    } else {
      // Si no tiene Content-Type: application/json, devolvemos 400
      return res.status(400).json({ error: 'Se esperaba Content-Type: application/json' });
    }
  }
  // Para cualquier otra ruta/método, salimos sin parsear
  next();
}

// MIDDLEWARE de captura de errores de JSON.parse
function handleJsonError(err, req, res, next) {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    'body' in err
  ) {
    // Si falló JSON.parse, respondemos 400 sin imprimir el stack
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next(err);
}

// Registramos los middlewares
app.use(onlyJsonBody);
app.use(handleJsonError);

// Ruta principal POST /procesar
app.post('/procesar', async (req, res) => {
  // En este punto, req.body ya es un objeto JavaScript válido
  const { deviceId, payload } = req.body;

  // Validaciones básicas
  if (!deviceId || !payload || typeof payload.complexity !== 'number') {
    return res.status(400).json({ error: 'Request mal formado' });
  }

  const complexity = payload.complexity;
  const taskId = uuidv4();
  const workersCount = 2;
  const promises = [];

  // Lanzamos N worker_threads en paralelo
  for (let i = 0; i < workersCount; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
          workerData: { workerIndex: i, complexity, taskId }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
      })
    );
  }

  let details;
  try {
    details = await Promise.all(promises);
  } catch (errWorkers) {
    return res.status(500).json({ error: 'Error en workers', message: errWorkers.message });
  }

  // Cuando todos terminan, notificamos al servicio-notificador
  const message = `Tarea ${taskId} completada. Detalles: ${details.join(' | ')}`;
  try {
    await axios.post('http://servicio-notificador:5003/notify', {
      deviceId,
      message
    });
  } catch (errNotify) {
    console.error('[Procesador] Error notificando:', errNotify.message);
    // No bloqueamos al usuario si la notificación falla, solo lo registramos
  }

  // Respondemos al cliente
  return res.json({ status: 'OK', taskId, details });
});

// Servidor
app.listen(PORT, () => {
  console.log(`[Procesador] escuchando en puerto ${PORT}`);
});
*/
// servicio-procesador/index.js

const express = require('express');
const { Worker } = require('worker_threads');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5002;

// MIDDLEWARE que solo parsea JSON si es POST a /procesar
function onlyJsonBody(req, res, next) {
  if (req.method === 'POST' && req.path === '/procesar') {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      return express.json()(req, res, next);
    } else {
      return res.status(400).json({ error: 'Se esperaba Content-Type: application/json' });
    }
  }
  next();
}

// MIDDLEWARE de captura de errores de JSON.parse
function handleJsonError(err, req, res, next) {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next(err);
}

app.use(onlyJsonBody);
app.use(handleJsonError);

app.post('/procesar', async (req, res) => {
  // Línea para imprimir en logs que llegó una petición válida:
  console.log(`[Procesador] Recibida tarea: ${req.body.deviceId}`);

  const { deviceId, payload } = req.body;
  if (!deviceId || !payload || typeof payload.complexity !== 'number') {
    return res.status(400).json({ error: 'Request mal formado' });
  }

  const complexity = payload.complexity;
  const taskId = uuidv4();
  const workersCount = 2;
  const promises = [];

  for (let i = 0; i < workersCount; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
          workerData: { workerIndex: i, complexity, taskId }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
      })
    );
  }

  let details;
  try {
    details = await Promise.all(promises);
  } catch (errWorkers) {
    return res.status(500).json({ error: 'Error en workers', message: errWorkers.message });
  }

  const message = `Tarea ${taskId} completada. Detalles: ${details.join(' | ')}`;
  try {
    await axios.post('http://servicio-notificador:5003/notify', {
      deviceId,
      message
    });
  } catch (errNotify) {
    console.error('[Procesador] Error notificando:', errNotify.message);
  }

  return res.json({ status: 'OK', taskId, details });
});

app.listen(PORT, () => {
  console.log(`[Procesador] escuchando en puerto ${PORT}`);
});

