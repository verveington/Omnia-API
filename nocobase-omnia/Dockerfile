ARG NOCOBASE_VERSION=2.0.60
FROM node:22-bookworm-slim AS plugin-builder

WORKDIR /build
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock lerna.json tsconfig.json tsconfig.server.json ./
RUN yarn install --frozen-lockfile --ignore-scripts
COPY packages/plugins/@omnia/plugin-customer-search packages/plugins/@omnia/plugin-customer-search
RUN node -e "require('@nocobase/cli/src/util').genTsConfigPaths()"
RUN yarn nocobase-build @omnia/plugin-customer-search

FROM nocobase/nocobase:${NOCOBASE_VERSION}

COPY --from=plugin-builder /build/packages/plugins/@omnia/plugin-customer-search /opt/omnia/plugin-customer-search
COPY --chmod=755 docker/install-omnia-plugin.sh /opt/omnia/install-plugin.sh
COPY --chmod=755 docker/nocobase-entrypoint.sh /usr/local/bin/nocobase-omnia-entrypoint
WORKDIR /app/nocobase
ENTRYPOINT ["nocobase-omnia-entrypoint"]
CMD ["/app/docker-entrypoint.sh"]
