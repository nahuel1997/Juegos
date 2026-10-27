# Se construye desde la raíz del repo (ver docker-compose.yml): además del front, copia la lógica
# de los juegos (api/src) que usa la simulación de la vista previa.
FROM node:20-alpine AS build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
COPY api/src /app/api/src
RUN npm run build

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
