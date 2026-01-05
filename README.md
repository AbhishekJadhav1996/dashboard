# Kubernetes Dashboard Pro

A modern, feature-rich Kubernetes dashboard that provides a better user experience than the official Kubernetes dashboard.

## Features

### 🎯 Core Features
- **Modern UI/UX**: Built with Material-UI for a clean, intuitive interface
- **Real-time Updates**: WebSocket support for live cluster monitoring
- **Comprehensive Resource Management**: View and manage Pods, Deployments, Services, Nodes, and Namespaces
- **Detailed Resource Views**: Deep dive into resource details, logs, and YAML
- **Multi-namespace Support**: Easy namespace switching across all views
- **Cluster Overview**: Dashboard with visual metrics and statistics
- **Resource Actions**: Create, delete, and manage Kubernetes resources

### 🚀 Key Improvements Over Official Dashboard
1. **Better Performance**: Lightweight and fast, optimized for large clusters
2. **Modern Design**: Material Design with responsive layout
3. **Enhanced Logs View**: Better log viewing experience with syntax highlighting
4. **Improved Navigation**: Intuitive sidebar navigation
5. **Real-time Metrics**: Live updates without manual refresh
6. **Better Error Handling**: Clear error messages and user feedback
7. **Resource Filtering**: Easy namespace and resource filtering

## Architecture

- **Frontend**: React 18 with Material-UI
- **Backend**: Node.js with Express
- **Kubernetes Client**: Official Kubernetes JavaScript client
- **Real-time**: WebSocket support for live updates

## Prerequisites

- Node.js 18+ and npm
- Kubernetes cluster (local or remote)
- kubectl configured with cluster access
- Docker (for containerized deployment)

## Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dashboard
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Kubernetes access**
   
   The application uses the default Kubernetes configuration from `~/.kube/config`. Ensure your kubectl is properly configured:
   ```bash
   kubectl cluster-info
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend development server on `http://localhost:3000`

5. **Access the dashboard**
   
   Open your browser and navigate to `http://localhost:3000`

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t k8s-dashboard-pro:latest .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name k8s-dashboard-pro \
     -p 3001:3001 \
     -v ~/.kube/config:/root/.kube/config:ro \
     k8s-dashboard-pro:latest
   ```

   **Note**: Mount your kubeconfig file so the container can access your cluster.

### Kubernetes Deployment

1. **Build and push the image** (adjust registry as needed)
   ```bash
   docker build -t your-registry/k8s-dashboard-pro:latest .
   docker push your-registry/k8s-dashboard-pro:latest
   ```

2. **Update the image in deployment.yaml**
   
   Edit `k8s/deployment.yaml` and update the image name if needed.

3. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

4. **Access the dashboard**
   
   **Option 1: Port Forward**
   ```bash
   kubectl port-forward -n kube-system svc/k8s-dashboard-pro 8080:80
   ```
   Then access at `http://localhost:8080`

   **Option 2: Ingress** (if configured)
   
   Update the ingress host in `k8s/deployment.yaml` and access via the configured domain.

## Usage

### Dashboard Overview
- View cluster-wide statistics
- Monitor pod status distribution
- Track resource counts

### Pods Management
- View all pods across namespaces
- Filter by namespace
- View pod details, logs, and YAML
- Delete pods

### Deployments
- Monitor deployment status
- View replica availability
- Track deployment health

### Services
- View service types and configurations
- Monitor service endpoints
- View port mappings

### Nodes
- Monitor node status
- View node resources and capacity
- Track node health

## API Endpoints

The backend provides RESTful API endpoints:

- `GET /api/health` - Health check
- `GET /api/cluster/info` - Cluster information
- `GET /api/namespaces` - List namespaces
- `GET /api/pods` - List pods
- `GET /api/pods/:namespace/:name` - Get pod details
- `GET /api/pods/:namespace/:name/logs` - Get pod logs
- `GET /api/deployments` - List deployments
- `GET /api/services` - List services
- `GET /api/nodes` - List nodes
- `GET /api/metrics/summary` - Cluster metrics summary
- `DELETE /api/pods/:namespace/:name` - Delete pod
- `DELETE /api/deployments/:namespace/:name` - Delete deployment
- `POST /api/namespaces` - Create namespace
- `WS /ws` - WebSocket for real-time updates

## Configuration

### Environment Variables

**Backend** (`server/.env`):
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

**Frontend** (`client/.env`):
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3001/api)

## Security Considerations

⚠️ **Important**: This dashboard requires cluster-admin permissions to function properly. In production:

1. **Use RBAC**: The provided RBAC configuration grants necessary permissions
2. **Network Policies**: Restrict network access to the dashboard
3. **Authentication**: Add authentication layer (OAuth, LDAP, etc.)
4. **TLS**: Use HTTPS in production
5. **Service Account**: Use dedicated service account with minimal required permissions

## Troubleshooting

### Cannot connect to cluster
- Verify kubectl is configured: `kubectl cluster-info`
- Check if the kubeconfig file is accessible
- Verify network connectivity to the cluster

### Permission errors
- Ensure the service account has required RBAC permissions
- Check ClusterRole and ClusterRoleBinding are applied

### Port already in use
- Change the PORT in `.env` file
- Or stop the process using the port

### Build errors
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Development

### Project Structure
```
Dashboard/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
├── server/          # Node.js backend
│   └── index.js     # Express server
├── k8s/             # Kubernetes manifests
└── Dockerfile       # Docker build file
```

### Adding New Features

1. **Backend**: Add routes in `server/index.js`
2. **Frontend**: Create components in `client/src/pages/`
3. **API**: Add service methods in `client/src/services/api.js`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your needs.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Charts from [Recharts](https://recharts.org/)
- Kubernetes client from [@kubernetes/client-node](https://github.com/kubernetes-client/javascript)

