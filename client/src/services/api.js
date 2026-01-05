import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getClusterInfo = () => api.get('/cluster/info');
export const getNamespaces = () => api.get('/namespaces');
export const getPods = (namespace) => api.get('/pods', { params: { namespace } });
export const getPodDetails = (namespace, name) => api.get(`/pods/${namespace}/${name}`);
export const getPodLogs = (namespace, name, container, tailLines = 100) => 
  api.get(`/pods/${namespace}/${name}/logs`, { 
    params: { container, tailLines } 
  });
export const getDeployments = (namespace) => api.get('/deployments', { params: { namespace } });
export const getServices = (namespace) => api.get('/services', { params: { namespace } });
export const getNodes = () => api.get('/nodes');
export const getMetricsSummary = () => api.get('/metrics/summary');
export const deletePod = (namespace, name) => api.delete(`/pods/${namespace}/${name}`);
export const deleteDeployment = (namespace, name) => api.delete(`/deployments/${namespace}/${name}`);
export const createNamespace = (name, labels) => api.post('/namespaces', { name, labels });

export default api;

