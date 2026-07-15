ARG NOCOBASE_VERSION=2.0.60
FROM nocobase/nocobase:${NOCOBASE_VERSION} AS plugin-builder

USER root
COPY packages/plugins/@omnia/plugin-customer-search /app/nocobase/packages/plugins/@omnia/plugin-customer-search
WORKDIR /app/nocobase
RUN yarn build @omnia/plugin-customer-search

ARG NOCOBASE_VERSION=2.0.60
FROM nocobase/nocobase:${NOCOBASE_VERSION}

COPY --from=plugin-builder /app/nocobase/packages/plugins/@omnia/plugin-customer-search /app/nocobase/packages/plugins/@omnia/plugin-customer-search
WORKDIR /app/nocobase

