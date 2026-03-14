#!/bin/bash

# SAPOM Docker Helper Script
# Usage: ./docker.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="sapom-prototype"

# Print colored message
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Show usage
usage() {
    print_message "$BLUE" "SAPOM Docker Helper Script"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build-prod       Build production Docker image"
    echo "  build-dev        Build development Docker image"
    echo "  run-prod         Run production container (port 8080)"
    echo "  run-dev          Run development container (port 5173)"
    echo "  start            Start containers with docker-compose (production)"
    echo "  start-dev        Start containers with docker-compose (development)"
    echo "  stop             Stop all containers"
    echo "  restart          Restart containers"
    echo "  logs             Show container logs"
    echo "  logs-follow      Follow container logs"
    echo "  shell            Open shell in production container"
    echo "  shell-dev        Open shell in development container"
    echo "  clean            Remove containers and images"
    echo "  clean-all        Remove everything (containers, images, volumes)"
    echo "  health           Check container health"
    echo "  status           Show container status"
    echo ""
}

# Build production image
build_prod() {
    print_message "$YELLOW" "Building production image..."
    docker build -t ${PROJECT_NAME}:latest -t ${PROJECT_NAME}:prod .
    print_message "$GREEN" "✓ Production image built successfully"
}

# Build development image
build_dev() {
    print_message "$YELLOW" "Building development image..."
    docker build -f Dockerfile.dev -t ${PROJECT_NAME}:dev .
    print_message "$GREEN" "✓ Development image built successfully"
}

# Run production container
run_prod() {
    print_message "$YELLOW" "Starting production container..."
    docker run -d -p 8080:80 --name ${PROJECT_NAME}-prod ${PROJECT_NAME}:prod
    print_message "$GREEN" "✓ Production container started"
    print_message "$BLUE" "  Access at: http://localhost:8080"
}

# Run development container
run_dev() {
    print_message "$YELLOW" "Starting development container..."
    docker run -d -p 5173:5173 -v "$(pwd):/app" -v /app/node_modules --name ${PROJECT_NAME}-dev ${PROJECT_NAME}:dev
    print_message "$GREEN" "✓ Development container started"
    print_message "$BLUE" "  Access at: http://localhost:5173"
}

# Start with docker-compose
start() {
    print_message "$YELLOW" "Starting production with docker-compose..."
    docker-compose --profile prod up -d
    print_message "$GREEN" "✓ Production containers started"
    print_message "$BLUE" "  Access at: http://localhost:8080"
}

# Start development with docker-compose
start_dev() {
    print_message "$YELLOW" "Starting development with docker-compose..."
    docker-compose --profile dev up -d
    print_message "$GREEN" "✓ Development containers started"
    print_message "$BLUE" "  Access at: http://localhost:5173"
}

# Stop containers
stop() {
    print_message "$YELLOW" "Stopping containers..."
    docker-compose down 2>/dev/null || true
    docker stop ${PROJECT_NAME}-prod 2>/dev/null || true
    docker stop ${PROJECT_NAME}-dev 2>/dev/null || true
    print_message "$GREEN" "✓ Containers stopped"
}

# Restart containers
restart() {
    stop
    print_message "$YELLOW" "Restarting containers..."
    start
}

# Show logs
logs() {
    print_message "$BLUE" "Container logs:"
    docker-compose logs --tail=100 2>/dev/null || \
    docker logs ${PROJECT_NAME}-prod 2>/dev/null || \
    docker logs ${PROJECT_NAME}-dev 2>/dev/null || \
    print_message "$RED" "No running containers found"
}

# Follow logs
logs_follow() {
    print_message "$BLUE" "Following container logs (Ctrl+C to exit):"
    docker-compose logs -f 2>/dev/null || \
    docker logs -f ${PROJECT_NAME}-prod 2>/dev/null || \
    docker logs -f ${PROJECT_NAME}-dev 2>/dev/null || \
    print_message "$RED" "No running containers found"
}

# Open shell in production container
shell() {
    print_message "$BLUE" "Opening shell in production container..."
    docker exec -it ${PROJECT_NAME}-prod sh || \
    docker exec -it sapom-prod sh || \
    print_message "$RED" "Production container not running"
}

# Open shell in development container
shell_dev() {
    print_message "$BLUE" "Opening shell in development container..."
    docker exec -it ${PROJECT_NAME}-dev sh || \
    docker exec -it sapom-dev sh || \
    print_message "$RED" "Development container not running"
}

# Clean containers and images
clean() {
    print_message "$YELLOW" "Cleaning containers and images..."
    docker-compose down 2>/dev/null || true
    docker rm -f ${PROJECT_NAME}-prod ${PROJECT_NAME}-dev 2>/dev/null || true
    docker rmi ${PROJECT_NAME}:latest ${PROJECT_NAME}:prod ${PROJECT_NAME}:dev 2>/dev/null || true
    print_message "$GREEN" "✓ Cleaned up"
}

# Clean everything
clean_all() {
    print_message "$RED" "Warning: This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "$YELLOW" "Cleaning everything..."
        docker-compose down -v 2>/dev/null || true
        docker rm -f ${PROJECT_NAME}-prod ${PROJECT_NAME}-dev 2>/dev/null || true
        docker rmi ${PROJECT_NAME}:latest ${PROJECT_NAME}:prod ${PROJECT_NAME}:dev 2>/dev/null || true
        docker volume prune -f
        print_message "$GREEN" "✓ Everything cleaned"
    fi
}

# Check health
health() {
    print_message "$BLUE" "Checking container health..."
    
    # Check production container
    if docker ps --format '{{.Names}}' | grep -q "${PROJECT_NAME}-prod\|sapom-prod"; then
        container=$(docker ps --format '{{.Names}}' | grep "${PROJECT_NAME}-prod\|sapom-prod" | head -1)
        health_status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no health check")
        print_message "$GREEN" "Production: $health_status"
        
        # Try to access health endpoint
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            print_message "$GREEN" "  Health endpoint: accessible"
        else
            print_message "$RED" "  Health endpoint: not accessible"
        fi
    else
        print_message "$YELLOW" "Production container not running"
    fi
    
    # Check development container
    if docker ps --format '{{.Names}}' | grep -q "${PROJECT_NAME}-dev\|sapom-dev"; then
        print_message "$GREEN" "Development: running"
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            print_message "$GREEN" "  Dev server: accessible"
        else
            print_message "$RED" "  Dev server: not accessible"
        fi
    else
        print_message "$YELLOW" "Development container not running"
    fi
}

# Show status
status() {
    print_message "$BLUE" "Container Status:"
    echo ""
    docker ps -a --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    print_message "$BLUE" "Images:"
    docker images --filter "reference=${PROJECT_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
}

# Main script
case "${1}" in
    build-prod)
        build_prod
        ;;
    build-dev)
        build_dev
        ;;
    run-prod)
        run_prod
        ;;
    run-dev)
        run_dev
        ;;
    start)
        start
        ;;
    start-dev)
        start_dev
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-follow)
        logs_follow
        ;;
    shell)
        shell
        ;;
    shell-dev)
        shell_dev
        ;;
    clean)
        clean
        ;;
    clean-all)
        clean_all
        ;;
    health)
        health
        ;;
    status)
        status
        ;;
    *)
        usage
        exit 1
        ;;
esac
