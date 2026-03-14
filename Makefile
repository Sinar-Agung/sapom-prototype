# Makefile for SAPOM Prototype Docker operations
# Usage: make [target]

.PHONY: help build-prod build-dev run-prod run-dev start start-dev stop restart logs shell clean status

# Project name
PROJECT_NAME := sapom-prototype

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(BLUE)SAPOM Prototype - Docker Commands$(NC)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' Makefile | sed 's/## /  /'
	@echo ""

## build-prod: Build production Docker image
build-prod:
	@echo "$(YELLOW)Building production image...$(NC)"
	docker build -t $(PROJECT_NAME):latest -t $(PROJECT_NAME):prod .
	@echo "$(GREEN)✓ Production image built$(NC)"

## build-dev: Build development Docker image
build-dev:
	@echo "$(YELLOW)Building development image...$(NC)"
	docker build -f Dockerfile.dev -t $(PROJECT_NAME):dev .
	@echo "$(GREEN)✓ Development image built$(NC)"

## run-prod: Run production container on port 8080
run-prod:
	@echo "$(YELLOW)Starting production container...$(NC)"
	docker run -d -p 8080:80 --name $(PROJECT_NAME)-prod $(PROJECT_NAME):prod
	@echo "$(GREEN)✓ Production started at http://localhost:8080$(NC)"

## run-dev: Run development container on port 5173
run-dev:
	@echo "$(YELLOW)Starting development container...$(NC)"
	docker run -d -p 5173:5173 -v "$$(pwd):/app" -v /app/node_modules --name $(PROJECT_NAME)-dev $(PROJECT_NAME):dev
	@echo "$(GREEN)✓ Development started at http://localhost:5173$(NC)"

## start: Start production with docker-compose
start:
	@echo "$(YELLOW)Starting production...$(NC)"
	docker-compose --profile prod up -d
	@echo "$(GREEN)✓ Production started at http://localhost:8080$(NC)"

## start-dev: Start development with docker-compose
start-dev:
	@echo "$(YELLOW)Starting development...$(NC)"
	docker-compose --profile dev up -d
	@echo "$(GREEN)✓ Development started at http://localhost:5173$(NC)"

## stop: Stop all containers
stop:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	-docker-compose down 2>/dev/null || true
	-docker stop $(PROJECT_NAME)-prod 2>/dev/null || true
	-docker stop $(PROJECT_NAME)-dev 2>/dev/null || true
	@echo "$(GREEN)✓ Containers stopped$(NC)"

## restart: Restart production containers
restart: stop start

## logs: Show container logs
logs:
	docker-compose logs --tail=100 || docker logs $(PROJECT_NAME)-prod || docker logs $(PROJECT_NAME)-dev

## logs-follow: Follow container logs
logs-follow:
	docker-compose logs -f || docker logs -f $(PROJECT_NAME)-prod || docker logs -f $(PROJECT_NAME)-dev

## shell: Open shell in production container
shell:
	docker exec -it $(PROJECT_NAME)-prod sh || docker exec -it sapom-prod sh

## shell-dev: Open shell in development container
shell-dev:
	docker exec -it $(PROJECT_NAME)-dev sh || docker exec -it sapom-dev sh

## clean: Remove containers and images
clean: stop
	@echo "$(YELLOW)Cleaning up...$(NC)"
	-docker rm $(PROJECT_NAME)-prod $(PROJECT_NAME)-dev 2>/dev/null || true
	-docker rmi $(PROJECT_NAME):latest $(PROJECT_NAME):prod $(PROJECT_NAME):dev 2>/dev/null || true
	@echo "$(GREEN)✓ Cleaned up$(NC)"

## clean-all: Remove everything (containers, images, volumes)
clean-all: clean
	@echo "$(YELLOW)Removing volumes...$(NC)"
	docker volume prune -f
	@echo "$(GREEN)✓ Everything cleaned$(NC)"

## status: Show container and image status
status:
	@echo "$(BLUE)Container Status:$(NC)"
	@docker ps -a --filter "name=$(PROJECT_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(BLUE)Images:$(NC)"
	@docker images --filter "reference=$(PROJECT_NAME)" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

## health: Check container health
health:
	@echo "$(BLUE)Checking container health...$(NC)"
	@docker ps --format '{{.Names}}' | grep -q "$(PROJECT_NAME)-prod" && \
		(echo "$(GREEN)Production: running$(NC)" && \
		 curl -s http://localhost:8080/health > /dev/null && echo "$(GREEN)  Health: OK$(NC)" || echo "$(YELLOW)  Health: Check failed$(NC)") || \
		echo "$(YELLOW)Production: not running$(NC)"
	@docker ps --format '{{.Names}}' | grep -q "$(PROJECT_NAME)-dev" && \
		(echo "$(GREEN)Development: running$(NC)" && \
		 curl -s http://localhost:5173 > /dev/null && echo "$(GREEN)  Status: OK$(NC)" || echo "$(YELLOW)  Status: Check failed$(NC)") || \
		echo "$(YELLOW)Development: not running$(NC)"

## test: Run tests in container
test:
	docker run --rm $(PROJECT_NAME):latest pnpm test || echo "No tests configured"

## build-all: Build both production and development images
build-all: build-prod build-dev

## up: Alias for start
up: start

## down: Alias for stop
down: stop

## ps: Show running containers
ps:
	docker ps --filter "name=$(PROJECT_NAME)"
