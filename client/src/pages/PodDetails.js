import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ReactJson from 'react-json-view';
import { getPodDetails, getPodLogs } from '../services/api';

export default function PodDetails() {
  const { namespace, name } = useParams();
  const navigate = useNavigate();
  const [pod, setPod] = useState(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    loadPodDetails();
  }, [namespace, name]);

  useEffect(() => {
    if (pod && tab === 1) {
      loadLogs();
    }
  }, [tab, pod]);

  const loadPodDetails = async () => {
    setLoading(true);
    try {
      const response = await getPodDetails(namespace, name);
      setPod(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const container = pod?.spec?.containers?.[0]?.name;
      if (container) {
        const response = await getPodLogs(namespace, name, container, 500);
        setLogs(response.data.logs);
      }
    } catch (err) {
      setLogs(`Error loading logs: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !pod) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pods')} sx={{ mb: 2 }}>
          Back to Pods
        </Button>
        <Alert severity="error">{error || 'Pod not found'}</Alert>
      </Box>
    );
  }

  const status = pod.status?.phase || 'Unknown';
  const containers = pod.spec?.containers || [];
  const containerStatuses = pod.status?.containerStatuses || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pods')}>
          Back
        </Button>
        <Typography variant="h4">{name}</Typography>
        <Chip label={status} color={status === 'Running' ? 'success' : 'default'} />
      </Box>

      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Logs" />
        <Tab label="YAML" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pod Information</Typography>
                <Typography><strong>Namespace:</strong> {pod.metadata?.namespace}</Typography>
                <Typography><strong>Status:</strong> {status}</Typography>
                <Typography><strong>Node:</strong> {pod.spec?.nodeName || 'N/A'}</Typography>
                <Typography><strong>IP:</strong> {pod.status?.podIP || 'N/A'}</Typography>
                <Typography><strong>Created:</strong> {pod.metadata?.creationTimestamp ? new Date(pod.metadata.creationTimestamp).toLocaleString() : 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Containers</Typography>
                {containers.map((container, idx) => {
                  const status = containerStatuses.find(cs => cs.name === container.name);
                  return (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography><strong>{container.name}</strong></Typography>
                      <Typography variant="body2">Image: {container.image}</Typography>
                      <Typography variant="body2">
                        Ready: {status?.ready ? 'Yes' : 'No'} | 
                        Restarts: {status?.restartCount || 0}
                      </Typography>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          {pod.metadata?.labels && Object.keys(pod.metadata.labels).length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Labels</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(pod.metadata.labels).map(([key, value]) => (
                      <Chip key={key} label={`${key}: ${value}`} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Container Logs</Typography>
          <Box
            sx={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '600px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {logs || 'Loading logs...'}
          </Box>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Pod YAML</Typography>
          <ReactJson
            src={pod}
            theme="monokai"
            collapsed={2}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={true}
          />
        </Paper>
      )}
    </Box>
  );
}

