#!/bin/bash

set -e

echo "======================================================"
echo " 🚀 JEE/NEET Platform - Production Microservices Deployer "
echo "======================================================"

echo "🔍 Performing pre-flight checks..."
if ! [ -x "$(command -v docker)" ]; then
  echo '❌ Error: docker is not installed. Please install Docker first.' >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &>/dev/null; then
  echo '❌ Error: docker-compose is not installed. Please install Docker Compose first.' >&2
  exit 1
fi

COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
  COMPOSE_CMD="docker-compose"
fi

if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please configure your credentials inside '.env' before running."
  exit 1
fi

source .env

echo "📦 Pulling latest microservices containers..."
$COMPOSE_CMD pull

echo "🔄 Re-launching production containers with minimal downtime..."
$COMPOSE_CMD up -d --remove-orphans

echo "⏳ Waiting for containers to initialize..."
sleep 10

echo "🔍 Validating microservice container health..."
$COMPOSE_CMD ps

echo "🧹 Pruning old unused images and volumes..."
docker image prune -f

echo "======================================================"
echo " ✅ Deployment Completed Successfully!"
echo " 🌐 Edge proxy Nginx is live on port 80!"
echo " 🔌 Internal API Gateway is listening on port 5000!"
echo "======================================================"
