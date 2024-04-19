FROM node:21-alpine3.18

WORKDIR /src

COPY . .

RUN npm install
RUN npx tsc

EXPOSE 4000

CMD ["node","dist/index.js"]