FROM node:20-alpine AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY pkg/dispatch_migration/package.json pkg/dispatch_migration/package-lock.json /temp/dev/
RUN cd /temp/dev && npm install

# Then copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY pkg/dispatch_migration .
RUN pwd
RUN ls -la

# copy production dependencies and source code into final image
FROM base AS release
USER node
COPY --chown=node:node --from=install /temp/dev/node_modules node_modules
# COPY --chown=node:node --from=prerelease /usr/src/app/migrations ./migrations 
COPY --chown=node:node --from=prerelease /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=prerelease /usr/src/app/database.json ./database.json
