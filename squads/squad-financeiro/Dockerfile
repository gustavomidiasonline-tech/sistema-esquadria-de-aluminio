FROM node:25.7.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production 2>/dev/null || npm install

COPY server.js ./
COPY scripts/ ./scripts/

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3005/health || exit 1

CMD ["node", "server.js"]
