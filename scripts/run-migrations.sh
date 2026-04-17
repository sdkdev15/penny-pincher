#!/bin/bash

# Run Prisma migrations inside Docker container
echo "Running database migrations..."

# First, ensure containers are up
docker-compose up -d postgres

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations
docker-compose exec -T nodeapp npx prisma migrate deploy

echo "Migrations completed!"