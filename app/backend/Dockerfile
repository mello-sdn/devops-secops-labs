FROM node:26-alpine AS builder 

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:26-alpine

ENV NODE_ENV=production

RUN npm install -g npm@12.0.1 && \
    npm install -g brace-expansion@5.0.8 && \
    rm -rf /usr/local/lib/node_modules/npm/node_modules/brace-expansion && \
    cp -r /usr/local/lib/node_modules/brace-expansion /usr/local/lib/node_modules/npm/node_modules/brace-expansion && \
    npm uninstall -g brace-expansion

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

USER node

EXPOSE 5000

CMD ["node", "server.js"]
