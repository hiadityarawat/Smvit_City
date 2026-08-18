FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY server ./server
RUN npm run build -w @socialverse/shared && npm run db:generate -w @socialverse/server && npm run build -w @socialverse/server

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --omit=dev
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/node_modules/.prisma ./server/node_modules/.prisma
EXPOSE 4000
CMD ["sh", "-c", "npm run db:deploy -w @socialverse/server && node server/dist/index.js"]
