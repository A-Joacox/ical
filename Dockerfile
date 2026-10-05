# Etapa 1: compila la PWA
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci
COPY apps/web apps/web
RUN npm run build -w apps/web

# Etapa 2: server con solo dependencias de producción + la PWA compilada
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --omit=dev -w apps/server
COPY apps/server/src apps/server/src
COPY --from=build /app/apps/web/dist apps/web/dist
EXPOSE 3000
CMD ["node", "apps/server/src/index.ts"]
