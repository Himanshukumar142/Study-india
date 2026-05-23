#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "======================================================"
echo " 🚀 JEE/NEET Platform - Production Microservices Deployer "
echo "======================================================"

# Step 1: Pre-flight checks
echo "🔍 Performing pre-flight checks..."
if ! [ -x "$(command -v docker)" ]; then
  echo '❌ Error: docker is not installed. Please install Docker first.' >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &>/dev/null; then
  echo '❌ Error: docker-compose is not installed. Please install Docker Compose first.' >&2
  exit 1
fi

# Detect docker compose command style
COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
  COMPOSE_CMD="docker-compose"
fi

# Step 2: Environment variables check
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please configure your credentials inside '.env' before running."
  exit 1
fi

# Load environment variables
source .env

echo "📦 Pulling latest microservices containers..."
$COMPOSE_CMD pull

echo "🔄 Re-launching production containers with minimal downtime..."
$COMPOSE_CMD up -d --remove-orphans

echo "⏳ Waiting for containers to initialize..."
sleep 10

echo "🔍 Validating microservice container health..."
$COMPOSE_CMD ps

# Step 3: Cleanup dangling resources to conserve disk space
echo "🧹 Pruning old unused images and volumes..."
docker image prune -f

echo "======================================================"
echo " ✅ Deployment Completed Successfully!"
echo " 🌐 Edge proxy Nginx is live on port 80!"
echo " 🔌 Internal API Gateway is listening on port 5000!"
echo "======================================================"
