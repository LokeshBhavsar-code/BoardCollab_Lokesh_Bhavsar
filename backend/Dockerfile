FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache cairo pango jpeg giflib librsvg

FROM base AS development
RUN apk add --no-cache build-base python3 cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
ENV npm_config_nodedir=/usr/local
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS production-dependencies
RUN apk add --no-cache --virtual .build-deps build-base python3 cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
ENV npm_config_nodedir=/usr/local
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM base AS production
ENV NODE_ENV=production
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY package.json ./package.json
COPY src ./src
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:5000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["npm", "start"]
