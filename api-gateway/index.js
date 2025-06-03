// index.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5001;

// Cuando el cliente haga POST /api/facturar
// se reenvía a NGINX (balanceador) en /procesar
app.use(
  '/api/facturar',
  createProxyMiddleware({
    target: 'http://nginx-loadbalancer:80',
    pathRewrite: { '^/api/facturar': '/procesar' },
    changeOrigin: true
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway escuchando en puerto ${PORT}`);
});
