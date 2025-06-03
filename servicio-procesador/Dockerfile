# Dockerfile del servicio-procesador
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiamos package.json e instalamos dependencias
COPY package.json ./
RUN npm install --production

# Copiamos el código fuente
COPY index.js worker.js ./

EXPOSE 5002
CMD ["npm", "start"]
