FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache build-base python3 cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
ENV npm_config_nodedir=/usr/local
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
