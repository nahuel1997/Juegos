FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 4400
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4400/api/salud || exit 1
CMD ["node", "src/index.js"]
