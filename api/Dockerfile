FROM node:26-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only, cached unless the lockfile changes
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Node runs the .ts files directly via type stripping, so there is no build step
COPY . .

# Config comes from environment variables (e.g. docker run --env-file ../.env)
ENV API_PORT=3000
EXPOSE 3000

USER node
CMD ["node", "index.ts"]
