#!/bin/sh
set -eu

mkdir -p /app/nocobase/storage/scripts
cp /opt/omnia/install-plugin.sh \
  /app/nocobase/storage/scripts/10-install-omnia-plugin.sh

exec "$@"
