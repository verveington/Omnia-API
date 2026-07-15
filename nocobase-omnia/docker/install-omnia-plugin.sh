#!/bin/sh
set -eu

plugin_target=/app/nocobase/packages/plugins/@omnia/plugin-customer-search
mkdir -p "$plugin_target"
cp -a /opt/omnia/plugin-customer-search/. "$plugin_target/"

mkdir -p /app/nocobase/node_modules/@omnia
ln -sfn ../../packages/plugins/@omnia/plugin-customer-search \
  /app/nocobase/node_modules/@omnia/plugin-customer-search
