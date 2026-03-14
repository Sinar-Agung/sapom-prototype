# SAPOM Prototype - Quick Start with Docker

Get up and running with SAPOM in under 5 minutes using Docker.

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

### Option 1: Production (Recommended)

```bash
# Build and run production
docker-compose --profile prod up -d

# Access at http://localhost:8080
```

### Option 2: Development (with hot reload)

```bash
# Build and run development
docker-compose --profile dev up -d

# Access at http://localhost:5173
```

### Option 3: Using Helper Scripts

**Linux/Mac:**
```bash
# Make script executable (first time only)
chmod +x docker.sh

# Run production
./docker.sh start

# Or run development
./docker.sh start-dev
```

**Windows:**
```cmd
REM Run production
docker.bat start

REM Or run development
docker.bat start-dev
```

### Option 4: Using Makefile (Linux/Mac)

```bash
# Start production
make start

# Start development
make start-dev

# Show all commands
make help
```

## 📋 Common Commands

### Production

| Command | Description |
|---------|-------------|
| `docker-compose --profile prod up -d` | Start production |
| `docker-compose logs -f` | View logs |
| `docker-compose down` | Stop production |
| `docker-compose restart` | Restart production |

### Development

| Command | Description |
|---------|-------------|
| `docker-compose --profile dev up -d` | Start development |
| `docker-compose logs -f` | View logs |
| `docker-compose down` | Stop development |

### Using Helper Scripts

**Linux/Mac (docker.sh):**
```bash
./docker.sh start           # Start production
./docker.sh start-dev       # Start development
./docker.sh stop            # Stop containers
./docker.sh logs            # View logs
./docker.sh logs-follow     # Follow logs
./docker.sh status          # Show status
./docker.sh health          # Check health
./docker.sh clean           # Clean up
```

**Windows (docker.bat):**
```cmd
docker.bat start           # Start production
docker.bat start-dev       # Start development
docker.bat stop            # Stop containers
docker.bat logs            # View logs
docker.bat status          # Show status
docker.bat clean           # Clean up
```

**Makefile (Linux/Mac):**
```bash
make start          # Start production
make start-dev      # Start development
make stop           # Stop containers
make logs           # View logs
make status         # Show status
make clean          # Clean up
make help           # Show all commands
```

## 🔍 Verify Installation

### Check Container Status
```bash
docker ps
```

You should see a container named `sapom-prod` or `sapom-dev` running.

### Check Application
- **Production:** Open http://localhost:8080
- **Development:** Open http://localhost:5173

### Check Health (Production only)
```bash
curl http://localhost:8080/health
```

Should return: `healthy`

## 🛠️ Troubleshooting

### Port Already in Use

**Change production port (8080 → 8090):**
```bash
# Edit docker-compose.yml, change:
ports:
  - "8090:80"  # Changed from 8080:80
```

**Or run directly with custom port:**
```bash
docker run -d -p 8090:80 sapom-prototype
```

### Container Won't Start

**Check logs:**
```bash
docker-compose logs
# or
docker logs sapom-prod
```

**Rebuild from scratch:**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose --profile prod up -d
```

### I see old code

**Rebuild production:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose --profile prod up -d
```

**For development (hot reload should handle this automatically):**
```bash
docker-compose restart
```

### Can't connect to Docker

**Windows (WSL2):**
- Make sure Docker Desktop is running
- Check WSL integration: Settings → Resources → WSL Integration

**Linux:**
```bash
sudo systemctl start docker
```

**Mac:**
- Make sure Docker Desktop is running

### Permission Denied (Linux)

**Run without sudo:**
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

## 📊 Resource Usage

### Check Memory & CPU
```bash
docker stats sapom-prod
# or
docker stats sapom-dev
```

### Image Sizes
- **Production image:** ~25MB (nginx + static files)
- **Development image:** ~400MB (node + dependencies)

## 🔄 Updating

### Pull Latest Changes
```bash
git pull origin main
```

### Rebuild Container
```bash
# Production
docker-compose down
docker-compose build --no-cache
docker-compose --profile prod up -d

# Development
docker-compose down
docker-compose build --no-cache
docker-compose --profile dev up -d
```

## 🧹 Cleanup

### Remove Containers Only
```bash
docker-compose down
```

### Remove Everything (containers + images)
```bash
docker-compose down
docker rmi sapom-prototype:prod sapom-prototype:dev
```

### Remove Everything + Volumes
```bash
docker-compose down -v
docker system prune -a
```

## 📚 Next Steps

- Read [README.Docker.md](README.Docker.md) for detailed documentation
- Configure environment variables (copy `.env.example` to `.env`)
- Set up CI/CD for automated deployment

## 🆘 Getting Help

**View all available commands:**
```bash
# Helper scripts
./docker.sh          # Linux/Mac
docker.bat           # Windows

# Makefile
make help            # Linux/Mac
```

**Check container status:**
```bash
docker ps -a
docker logs sapom-prod
```

**Access container shell:**
```bash
docker exec -it sapom-prod sh
```

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs` or `docker logs sapom-prod`
2. Review [README.Docker.md](README.Docker.md)
3. Check Docker documentation: https://docs.docker.com/

---

**Quick Reference:**

| Environment | Port | Command |
|-------------|------|---------|
| Production | 8080 | `docker-compose --profile prod up -d` |
| Development | 5173 | `docker-compose --profile dev up -d` |

Access: **http://localhost:8080** (prod) or **http://localhost:5173** (dev)
