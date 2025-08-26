# Makefile for managing the production environment

# Build and start all services in detached mode
up:
	docker compose -f docker-compose.prod.yml up --build -d

# Stop and remove all services, volumes, and networks
down:
	docker compose -f docker-compose.prod.yml down -v

# Restart the environment
restart: down up

# View logs for the backend service
logs-backend:
	docker compose -f docker-compose.prod.yml logs -f backend

# View logs for the frontend service (Nginx)
logs-frontend:
	docker compose -f docker-compose.prod.yml logs -f frontend

# Get a shell inside the backend container
bash-backend:
	docker compose -f docker-compose.prod.yml exec backend bash

# Apply database migrations
migrate:
	docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create a new database migration file
migration:
	@echo "Enter migration message: " && read msg; \
	docker compose -f docker-compose.prod.yml exec backend alembic revision --autogenerate -m "$$msg"

.PHONY: up down restart logs-backend logs-frontend bash-backend migrate migration
