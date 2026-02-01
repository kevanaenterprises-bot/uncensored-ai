# Dockerfile

FROM node:16

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]