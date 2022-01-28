FROM node:16-alpine

RUN apk update

WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
# copy source code to /app/src folder
COPY server /app/src/server
COPY infrastructure /app/src/infrastructure
# check files list
RUN ls -a ./src

RUN npm install
RUN npm run build

EXPOSE 8080

ENTRYPOINT ["node","--enable-source-maps", "dist/server/index.js"]