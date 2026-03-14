# Docker Setup for SAPOM Prototype

This document provides instructions for running the SAPOM prototype application using Docker.

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose 2.0.0 or higher

## Quick Start

### Production Build

Build and run the production container:

```bash
# Build the image
docker build -t sapom-prototype .

# Run the container
docker run -d -p 8080:80 --name sapom-app sapom-prototype

# Or use docker-compose
docker-compose --profile prod up -d
```

Access the application at: http://localhost:8080

### Development Mode

Run with hot reload for development:

```bash
# Using docker-compose
docker-compose --profile dev up -d

# Or build and run manually
docker build -f Dockerfile.dev -t sapom-dev .
docker run -d -p 5173:5173 -v $(pwd):/app -v /app/node_modules --name sapom-dev sapom-dev
```

Access the dev server at: http://localhost:5173

## Docker Commands

### Building Images

```bash
# Production image
docker build -t sapom-prototype:latest .

# Development image
docker build -f Dockerfile.dev -t sapom-prototype:dev .

# Build with specific tag
docker build -t sapom-prototype:v1.0.0 .
```

### Running Containers

```bash
# Production
docker-compose --profile prod up -d

# Development
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Container Management

```bash
# List running containers
docker ps

# View logs
docker logs sapom-prod
docker logs -f sapom-dev  # Follow logs

# Stop container
docker stop sapom-prod

# Remove container
docker rm sapom-prod

# Restart container
docker restart sapom-prod
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi sapom-prototype

# Prune unused images
docker image prune -a
```

## Volume Management

The development setup uses volumes for hot reload:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect sapom-prototype_node_modules

# Remove unused volumes
docker volume prune
```

## Health Check

The production container includes a health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' sapom-prod

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' sapom-prod
```

Access health endpoint: http://localhost:8080/health

## Environment Variables

You can pass environment variables to containers:

```bash
# Via command line
docker run -e NODE_ENV=production -d sapom-prototype

# Via .env file
docker run --env-file .env.production -d sapom-prototype

# Via docker-compose
# Add to docker-compose.yml under service > environment
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
# Linux/Mac
sudo lsof -i :8080

# Windows
netstat -ano | findstr :8080

# Use different port
docker run -p 8090:80 sapom-prototype
```

### Container Won't Start

```bash
# Check logs
docker logs sapom-prod

# Run interactively
docker run -it --rm sapom-prototype sh

# Check configuration
docker inspect sapom-prod
```

### Rebuild Container

```bash
# Remove old container and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose --profile prod up -d
```

### Clear Everything

```bash
# Remove all containers, images, and volumes
docker-compose down -v
docker system prune -a --volumes
```

## Production Deployment

### Build for Production

```bash
# Build optimized production image
docker build --no-cache -t sapom-prototype:prod .

# Tag for registry
docker tag sapom-prototype:prod registry.example.com/sapom-prototype:latest

# Push to registry
docker push registry.example.com/sapom-prototype:latest
```

### Deploy to Server

```bash
# Pull and run on server
docker pull registry.example.com/sapom-prototype:latest
docker run -d -p 80:80 --name sapom --restart always registry.example.com/sapom-prototype:latest
```

## Performance Optimization

The Dockerfile uses multi-stage builds to minimize image size:
- Build stage: ~400MB
- Final image: ~25MB (nginx + static files)

### Image Size Analysis

```bash
# View image layers
docker history sapom-prototype

# Analyze image size
docker images sapom-prototype
```

## Security Best Practices

1. **Use specific base image versions** - Already implemented with `node:20-alpine`
2. **Run as non-root user** - nginx in alpine runs as nginx user
3. **Scan for vulnerabilities**:
   ```bash
   docker scan sapom-prototype
   ```
4. **Keep images updated**:
   ```bash
   docker pull node:20-alpine
   docker pull nginx:alpine
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t sapom-prototype .
      - name: Run tests
        run: docker run --rm sapom-prototype pnpm test
```

## Support

For issues or questions:
- Check logs: `docker logs sapom-prod`
- Inspect container: `docker inspect sapom-prod`
- Enter container: `docker exec -it sapom-prod sh`

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
├─────────────────────────────────────┤
│  Nginx (Port 80)                    │
│    │                                │
│    ├─► Static Files (/dist)         │
│    ├─► SPA Routing (index.html)     │
│    ├─► Gzip Compression             │
│    └─► Health Check (/health)       │
└─────────────────────────────────────┘
           │
           ▼
     Host Port 8080
```

## License

Same as main application license.
