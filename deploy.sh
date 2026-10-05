#!/usr/bin/env sh
# Ejecutar en el Ubuntu, dentro del repo: trae los últimos cambios y reconstruye el contenedor.
set -e
git pull
docker compose up -d --build
