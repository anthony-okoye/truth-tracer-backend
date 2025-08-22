# Docker Containerization Guide

This guide explains how to build and run the Truth Tracer application using Docker.

## 🐳 Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and run the application
npm run docker:compose

# Or run in detached mode
npm run docker:compose:dev

# Stop the application
npm run docker:compose:down
```

### Using Docker directly

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run

# Or manually
docker build -t truth-tracer .
docker run -p 3030:3030 --env-file .env truth-tracer
```

## 📦 Image Details

- **Base Image**: `node:20-alpine` (minimal size)
- **Multi-stage build**: Optimized for production
- **Security**: Non-root user execution
- **Health Check**: Built-in health monitoring
- **Expected Size**: ~150-200MB

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3030
ALLOWED_ORIGINS=*
# Add other required environment variables
```

### Port Mapping

The application runs on port `3030` inside the container and is mapped to port `3030` on the host.

## 🚀 Production Deployment

### Build for Production

```bash
# Build optimized production image
docker build --target runner -t truth-tracer:prod .

# Run with production settings
docker run -d \
  --name truth-tracer \
  -p 3030:3030 \
  --env-file .env \
  --restart unless-stopped \
  truth-tracer:prod
```

### Health Monitoring

The container includes a health check that monitors the `/truth-tracer/health` endpoint:

```bash
# Check container health
docker ps
# Look for "healthy" status

# View health check logs
docker inspect truth-tracer | grep -A 10 "Health"
```

## 🧹 Maintenance

### Clean up Docker resources

```bash
# Clean unused images and containers
npm run docker:clean

# Remove specific image
docker rmi truth-tracer

# Remove all stopped containers
docker container prune
```

## 🔍 Troubleshooting

### View logs

```bash
# Using docker-compose
docker-compose logs -f truth-tracer

# Using docker directly
docker logs -f truth-tracer
```

### Access container shell

```bash
# Using docker-compose
docker-compose exec truth-tracer sh

# Using docker directly
docker exec -it truth-tracer sh
```

### Check container status

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Inspect container details
docker inspect truth-tracer
```

## 📊 Performance Optimization

The Dockerfile is optimized for:

- ✅ **Minimal image size** (Alpine Linux base)
- ✅ **Fast builds** (Multi-stage with dependency caching)
- ✅ **Security** (Non-root user, minimal attack surface)
- ✅ **Production ready** (Optimized for deployment)
- ✅ **Health monitoring** (Built-in health checks)

## 🔗 API Endpoints

Once running, the application will be available at:

- **Health Check**: `http://localhost:3030/truth-tracer/health`
- **API Documentation**: `http://localhost:3030/api/docs`
- **Main API**: `http://localhost:3030/truth-tracer/` 