FROM node:13.12.0-alpine

WORKDIR /app
COPY package.json .
RUN npm install --production
RUN npm install pm2 -g

COPY . .

EXPOSE 3000

CMD [ "pm2-runtime", "npm", "--", "start" ]