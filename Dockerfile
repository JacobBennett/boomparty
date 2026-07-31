FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY server ./server
COPY client ./client

EXPOSE 3000

CMD ["node", "server/app.js"]
