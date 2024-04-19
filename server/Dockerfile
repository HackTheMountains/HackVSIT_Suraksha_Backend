FROM node:21-alpine3.18

WORKDIR /src

COPY . .

RUN npm install
RUN npx tsc

EXPOSE dock00

CMD ["node","dist/index.js"]