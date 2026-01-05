# Quick Start Guide

Get the Kubernetes Dashboard Pro running in minutes!

## Option 1: Local Development (Recommended for Development)

```bash
# 1. Install dependencies
npm run install-all

# 2. Make sure kubectl is configured
kubectl cluster-info

# 3. Start the application
npm run dev
```

Open http://localhost:3000 in your browser.

## Option 2: Docker (Quick Test)

```bash
# 1. Build the image
docker build -t k8s-dashboard-pro:latest .

# 2. Run with Docker Compose
docker-compose up -d

# Or run directly
docker run -d \
  --name k8s-dashboard-pro \
  -p 3001:3001 \
  -v ~/.kube/config:/root/.kube/config:ro \
  k8s-dashboard-pro:latest
```

Access at http://localhost:3001

## Option 3: Deploy to Kubernetes

```bash
# 1. Build and tag image (replace with your registry)
docker build -t your-registry/k8s-dashboard-pro:latest .
docker push your-registry/k8s-dashboard-pro:latest

# 2. Update image in k8s/deployment.yaml if needed

# 3. Deploy
kubectl apply -f k8s/deployment.yaml

# 4. Port forward to access
kubectl port-forward -n kube-system svc/k8s-dashboard-pro 8080:80
```

Access at http://localhost:8080

## Troubleshooting

**Issue**: Cannot connect to cluster
- Solution: Ensure kubectl is configured: `kubectl cluster-info`

**Issue**: Permission denied
- Solution: Check RBAC permissions are applied: `kubectl get clusterrolebinding k8s-dashboard-pro`

**Issue**: Port already in use
- Solution: Change PORT in environment or use different port mapping

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the dashboard features
- Customize the UI to your needs

