// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

app.post('/notify', (req, res) => {
  const { deviceId, message } = req.body || {};
  if (!deviceId || !message) {
    return res.status(400).json({ status: 'ERROR', error: 'Faltan deviceId o message' });
  }

  // Simulación de envío push
  console.log(`[Notificador] → Enviando notificación a Device ${deviceId}: "${message}"`);

  return res.json({ status: 'SENT', deviceId, message });
});

app.listen(PORT, () => {
  console.log(`Servicio-notificador escuchando en puerto ${PORT}`);
});
