FROM node:20-alpine

# Install build dependencies for any potential native node modules if required
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5003

ENV NODE_ENV=production

CMD ["node", "server.js"]
