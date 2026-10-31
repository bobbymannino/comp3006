# Built from the repo root, not web-ui/, as the web UI imports the API's
# schemas and Docker cannot copy files from outside the folder it builds from:
#   docker build -f web-ui/Dockerfile -t comp3006-web-ui .

FROM node:26-alpine AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies, cached unless the lockfile changes
COPY web-ui/package.json web-ui/package-lock.json web-ui/
RUN npm ci --prefix web-ui

# The schemas import valibot, which is looked for in api/node_modules, so it is
# pointed at the web UI's rather than installing all of the API's dependencies.
# The link is relative to api/, so it goes up a folder first
COPY api/schemas.ts api/
RUN ln -s ../web-ui/node_modules api/node_modules

COPY web-ui web-ui

# Next writes NEXT_PUBLIC_ variables into the browser's code when it builds, so
# the live feed's address has to be given now rather than when the image runs
ARG NEXT_PUBLIC_LIVE_URL=ws://localhost:3001/api/posts
ENV NEXT_PUBLIC_LIVE_URL=$NEXT_PUBLIC_LIVE_URL
RUN npm run build --prefix web-ui

FROM node:26-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# The standalone build is a minimal server with only the files it needs. It
# keeps the repo's layout, so the web UI is in web-ui/. Static files are not
# included, so they are copied in beside it
COPY --from=build --chown=node:node /app/web-ui/.next/standalone ./
COPY --from=build --chown=node:node /app/web-ui/.next/static ./web-ui/.next/static

# The API's address is only used by the server, so it is given when the image
# runs (e.g. docker run -e API_URL=http://host.docker.internal:3001)
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

USER node
CMD ["node", "web-ui/server.js"]
