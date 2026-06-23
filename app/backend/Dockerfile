FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

USER node

EXPOSE 5000

CMD ["node", "server.js"]
