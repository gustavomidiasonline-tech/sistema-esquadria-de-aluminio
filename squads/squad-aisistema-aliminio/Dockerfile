FROM node:25.7.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production 2>/dev/null || npm install

COPY orquestrador.js ./
COPY docker-entrypoint.js ./
COPY scripts/ ./scripts/

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "docker-entrypoint.js"]
