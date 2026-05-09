FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./

RUN npm install -g pm2 && \
  npm install --production

COPY . .

RUN mkdir -p logs uploads && \
  chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pm2-runtime", "start", "pm2.config.js"]
