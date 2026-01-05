const express = require('express');
const cors = require('cors');
const k8s = require('@kubernetes/client-node');
const expressWs = require('express-ws');
const path = require('path');
require('dotenv').config();

const app = express();
expressWs(app);

// CORS configuration - allow requests from React dev server (port 3000) and production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || '*' 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Initialize Kubernetes client
let kc, k8sApi, k8sAppsApi, k8sMetricsApi, k8sCustomApi;
let k8sInitialized = false;

try {
  kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
  k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
  
  // Metrics API might not be available in all environments, make it optional
  try {
    if (k8s.MetricsV1beta1Api) {
      k8sMetricsApi = kc.makeApiClient(k8s.MetricsV1beta1Api);
    }
  } catch (metricsError) {
    console.warn('Metrics API not available:', metricsError.message);
  }
  
  k8sInitialized = true;
  console.log('Kubernetes client initialized successfully');
} catch (error) {
  console.warn('Warning: Kubernetes client initialization failed:', error.message);
  console.warn('The server will start but Kubernetes API endpoints will return errors.');
  console.warn('Make sure you have a valid kubeconfig file or are running in a Kubernetes cluster.');
}

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kubernetes Dashboard API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      clusterInfo: '/api/cluster/info',
      namespaces: '/api/namespaces',
      pods: '/api/pods',
      deployments: '/api/deployments',
      services: '/api/services',
      nodes: '/api/nodes',
      metrics: '/api/metrics/summary'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get cluster info
app.get('/api/cluster/info', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    // Get version info from nodes (kubelet version)
    let versionInfo = null;
    try {
      const nodesResponse = await k8sApi.listNode();
      if (nodesResponse.body.items && nodesResponse.body.items.length > 0) {
        const firstNode = nodesResponse.body.items[0];
        versionInfo = {
          kubeletVersion: firstNode.status?.nodeInfo?.kubeletVersion || 'unknown',
          kubeProxyVersion: firstNode.status?.nodeInfo?.kubeProxyVersion || 'unknown',
          containerRuntimeVersion: firstNode.status?.nodeInfo?.containerRuntimeVersion || 'unknown'
        };
      }
    } catch (versionError) {
      // Failed to get version info, continue without it
      console.warn('Failed to get cluster version from nodes:', versionError.message);
    }
    
    res.json({
      version: versionInfo,
      context: kc.getCurrentContext(),
      cluster: kc.getCurrentCluster()?.name || 'unknown'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get namespaces
app.get('/api/namespaces', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const response = await k8sApi.listNamespace();
    res.json(response.body.items.map(ns => ({
      name: ns.metadata.name,
      status: ns.status.phase,
      createdAt: ns.metadata.creationTimestamp,
      labels: ns.metadata.labels || {}
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pods
app.get('/api/pods', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const namespace = req.query.namespace || 'default';
    const response = await k8sApi.listNamespacedPod(namespace);
    const pods = response.body.items.map(pod => ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      status: pod.status.phase,
      node: pod.spec.nodeName,
      createdAt: pod.metadata.creationTimestamp,
      containers: pod.spec.containers.map(c => ({
        name: c.name,
        image: c.image,
        ready: pod.status.containerStatuses?.find(cs => cs.name === c.name)?.ready || false,
        restartCount: pod.status.containerStatuses?.find(cs => cs.name === c.name)?.restartCount || 0
      })),
      labels: pod.metadata.labels || {},
      ip: pod.status.podIP
    }));
    res.json(pods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pod details
app.get('/api/pods/:namespace/:name', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.readNamespacedPod(name, namespace);
    res.json(response.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pod logs
app.get('/api/pods/:namespace/:name/logs', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const { namespace, name } = req.params;
    const container = req.query.container;
    const tailLines = parseInt(req.query.tailLines) || 100;
    
    const log = await k8sApi.readNamespacedPodLog(
      name,
      namespace,
      container,
      false,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      tailLines
    );
    res.json({ logs: log.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get deployments
app.get('/api/deployments', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const namespace = req.query.namespace || 'default';
    const response = await k8sAppsApi.listNamespacedDeployment(namespace);
    const deployments = response.body.items.map(deploy => ({
      name: deploy.metadata.name,
      namespace: deploy.metadata.namespace,
      replicas: deploy.spec.replicas,
      readyReplicas: deploy.status.readyReplicas || 0,
      availableReplicas: deploy.status.availableReplicas || 0,
      createdAt: deploy.metadata.creationTimestamp,
      labels: deploy.metadata.labels || {},
      image: deploy.spec.template.spec.containers[0]?.image || 'N/A'
    }));
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get services
app.get('/api/services', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const namespace = req.query.namespace || 'default';
    const response = await k8sApi.listNamespacedService(namespace);
    const services = response.body.items.map(svc => ({
      name: svc.metadata.name,
      namespace: svc.metadata.namespace,
      type: svc.spec.type,
      clusterIP: svc.spec.clusterIP,
      ports: svc.spec.ports || [],
      createdAt: svc.metadata.creationTimestamp,
      labels: svc.metadata.labels || {}
    }));
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nodes
app.get('/api/nodes', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const response = await k8sApi.listNode();
    const nodes = response.body.items.map(node => {
      const status = node.status.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady';
      return {
        name: node.metadata.name,
        status,
        role: node.metadata.labels?.['node-role.kubernetes.io/master'] ? 'master' : 'worker',
        createdAt: node.metadata.creationTimestamp,
        labels: node.metadata.labels || {},
        kubeletVersion: node.status.nodeInfo.kubeletVersion,
        osImage: node.status.nodeInfo.osImage,
        architecture: node.status.nodeInfo.architecture,
        cpu: node.status.capacity?.cpu || '0',
        memory: node.status.capacity?.memory || '0',
        pods: node.status.capacity?.pods || '0'
      };
    });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cluster metrics summary
app.get('/api/metrics/summary', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const [podsResponse, nodesResponse, deploymentsResponse, servicesResponse] = await Promise.all([
      k8sApi.listPodForAllNamespaces(),
      k8sApi.listNode(),
      k8sAppsApi.listDeploymentForAllNamespaces(),
      k8sApi.listServiceForAllNamespaces()
    ]);

    const pods = podsResponse.body.items;
    const nodes = nodesResponse.body.items;
    const deployments = deploymentsResponse.body.items;
    const services = servicesResponse.body.items;

    const podStatuses = pods.reduce((acc, pod) => {
      const status = pod.status.phase;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      pods: {
        total: pods.length,
        running: podStatuses.Running || 0,
        pending: podStatuses.Pending || 0,
        failed: podStatuses.Failed || 0,
        succeeded: podStatuses.Succeeded || 0
      },
      nodes: {
        total: nodes.length,
        ready: nodes.filter(n => 
          n.status.conditions?.find(c => c.type === 'Ready')?.status === 'True'
        ).length
      },
      deployments: {
        total: deployments.length,
        available: deployments.filter(d => d.status.availableReplicas > 0).length
      },
      services: {
        total: services.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pod
app.delete('/api/pods/:namespace/:name', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const { namespace, name } = req.params;
    await k8sApi.deleteNamespacedPod(name, namespace);
    res.json({ message: `Pod ${name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete deployment
app.delete('/api/deployments/:namespace/:name', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const { namespace, name } = req.params;
    await k8sAppsApi.deleteNamespacedDeployment(name, namespace);
    res.json({ message: `Deployment ${name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create namespace
app.post('/api/namespaces', async (req, res) => {
  if (!k8sInitialized) {
    return res.status(503).json({ error: 'Kubernetes client not initialized. Please check your kubeconfig.' });
  }
  try {
    const { name, labels } = req.body;
    const namespace = {
      metadata: {
        name,
        labels: labels || {}
      }
    };
    const response = await k8sApi.createNamespace(namespace);
    res.json({ message: `Namespace ${name} created successfully`, namespace: response.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time updates
app.ws('/ws', (ws, req) => {
  console.log('WebSocket client connected');
  
  if (!k8sInitialized) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Kubernetes client not initialized. Please check your kubeconfig.'
    }));
    ws.close();
    return;
  }
  
  const interval = setInterval(async () => {
    try {
      const [podsResponse, nodesResponse] = await Promise.all([
        k8sApi.listPodForAllNamespaces(),
        k8sApi.listNode()
      ]);

      ws.send(JSON.stringify({
        type: 'update',
        data: {
          pods: podsResponse.body.items.length,
          nodes: nodesResponse.body.items.length,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }, 5000);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(interval);
  });
});

// Serve React app in production (catch-all handler)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Kubernetes Dashboard API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

