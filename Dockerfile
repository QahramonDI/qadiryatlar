FROM node:22-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN npm install --prefix server --omit=dev

COPY . .

WORKDIR /app/server
EXPOSE 3000
ENV PORT=3000

CMD ["node", "index.js"]
