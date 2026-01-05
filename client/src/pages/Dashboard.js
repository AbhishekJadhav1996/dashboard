import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Storage as PodsIcon,
  Computer as NodesIcon,
  Apps as DeploymentsIcon,
  CloudQueue as ServicesIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMetricsSummary, getClusterInfo } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [metricsRes, clusterRes] = await Promise.all([
        getMetricsSummary(),
        getClusterInfo(),
      ]);
      setMetrics(metricsRes.data);
      setClusterInfo(clusterRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading dashboard: {error}</Alert>;
  }

  const podData = metrics?.pods ? [
    { name: 'Running', value: metrics.pods.running },
    { name: 'Pending', value: metrics.pods.pending },
    { name: 'Failed', value: metrics.pods.failed },
    { name: 'Succeeded', value: metrics.pods.succeeded },
  ] : [];

  const resourceData = [
    { name: 'Pods', value: metrics?.pods?.total || 0, icon: <PodsIcon /> },
    { name: 'Nodes', value: metrics?.nodes?.total || 0, icon: <NodesIcon /> },
    { name: 'Deployments', value: metrics?.deployments?.total || 0, icon: <DeploymentsIcon /> },
    { name: 'Services', value: metrics?.services?.total || 0, icon: <ServicesIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cluster Overview
      </Typography>
      
      {clusterInfo && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Cluster Information</Typography>
          <Typography>Context: {clusterInfo.context}</Typography>
          <Typography>Cluster: {clusterInfo.cluster}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {resourceData.map((resource) => (
          <Grid item xs={12} sm={6} md={3} key={resource.name}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {resource.name}
                    </Typography>
                    <Typography variant="h4">{resource.value}</Typography>
                  </Box>
                  <Box sx={{ color: 'primary.main', fontSize: 40 }}>
                    {resource.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pod Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={podData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {podData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resource Summary
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

