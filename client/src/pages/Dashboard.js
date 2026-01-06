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
  Chip,
  LinearProgress,
  Fade,
  Grow,
  useTheme,
} from '@mui/material';
import {
  Storage as PodsIcon,
  Computer as NodesIcon,
  Apps as DeploymentsIcon,
  CloudQueue as ServicesIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Cloud as CloudIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { getMetricsSummary, getClusterInfo } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const POD_STATUS_COLORS = {
  Running: '#00C49F',
  Pending: '#FFBB28',
  Failed: '#FF8042',
  Succeeded: '#0088FE',
};

export default function Dashboard() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
      setLastUpdate(new Date());
    }, 10000);
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
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading cluster metrics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 3,
          '& .MuiAlert-icon': { fontSize: 28 },
        }}
      >
        Error loading dashboard: {error}
      </Alert>
    );
  }

  const podData = metrics?.pods ? [
    { name: 'Running', value: metrics.pods.running, color: POD_STATUS_COLORS.Running },
    { name: 'Pending', value: metrics.pods.pending, color: POD_STATUS_COLORS.Pending },
    { name: 'Failed', value: metrics.pods.failed, color: POD_STATUS_COLORS.Failed },
    { name: 'Succeeded', value: metrics.pods.succeeded, color: POD_STATUS_COLORS.Succeeded },
  ].filter(item => item.value > 0) : [];

  const resourceData = [
    { 
      name: 'Pods', 
      value: metrics?.pods?.total || 0, 
      icon: <PodsIcon />,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      status: metrics?.pods?.running || 0,
      total: metrics?.pods?.total || 0,
    },
    { 
      name: 'Nodes', 
      value: metrics?.nodes?.total || 0, 
      icon: <NodesIcon />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      status: metrics?.nodes?.ready || 0,
      total: metrics?.nodes?.total || 0,
    },
    { 
      name: 'Deployments', 
      value: metrics?.deployments?.total || 0, 
      icon: <DeploymentsIcon />,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      status: metrics?.deployments?.available || 0,
      total: metrics?.deployments?.total || 0,
    },
    { 
      name: 'Services', 
      value: metrics?.services?.total || 0, 
      icon: <ServicesIcon />,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      status: metrics?.services?.total || 0,
      total: metrics?.services?.total || 0,
    },
  ];

  const StatCard = ({ resource, index }) => {
    const percentage = resource.total > 0 ? Math.round((resource.status / resource.total) * 100) : 0;
    return (
      <Grow in={true} timeout={300 + index * 100}>
        <Card
          sx={{
            height: '100%',
            background: resource.gradient,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.1)',
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out',
            },
            '&:hover::before': {
              opacity: 1,
            },
          }}
        >
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.cloneElement(resource.icon, { sx: { fontSize: 32 } })}
              </Box>
              <Chip
                label={`${percentage}%`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
                size="small"
              />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {resource.value}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              {resource.name}
            </Typography>
            {resource.status !== undefined && resource.total > 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Active: {resource.status}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Total: {resource.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grow>
    );
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 4,
            mb: 4,
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                Cluster Overview
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Real-time monitoring and insights
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<SpeedIcon />}
                label={`Updated: ${lastUpdate.toLocaleTimeString()}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </Box>
          
          {clusterInfo && (
            <Box mt={3} display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<CloudIcon />}
                label={`Context: ${clusterInfo.context || 'N/A'}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
              <Chip
                icon={<MemoryIcon />}
                label={`Cluster: ${clusterInfo.cluster || 'N/A'}`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {resourceData.map((resource, index) => (
          <Grid item xs={12} sm={6} md={3} key={resource.name}>
            <StatCard resource={resource} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Pod Status Distribution */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={700}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Pod Status Distribution
                </Typography>
                <Box display="flex" gap={1}>
                  {podData.map((item) => (
                    <Chip
                      key={item.name}
                      label={item.name}
                      size="small"
                      sx={{
                        backgroundColor: item.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  ))}
                </Box>
              </Box>
              {podData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={podData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {podData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  height={350}
                  sx={{ color: 'text.secondary' }}
                >
                  <Typography>No pod data available</Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        </Grid>

        {/* Resource Summary Bar Chart */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={900}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Resource Summary
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Fade>
        </Grid>

        {/* Pod Status Details */}
        {metrics?.pods && (
          <Grid item xs={12}>
            <Fade in={true} timeout={1100}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(to right, #f5f7fa 0%, #c3cfe2 100%)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Pod Status Details
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { 
                      label: 'Running', 
                      value: metrics.pods.running, 
                      icon: <CheckCircleIcon />, 
                      color: POD_STATUS_COLORS.Running 
                    },
                    { 
                      label: 'Pending', 
                      value: metrics.pods.pending, 
                      icon: <ScheduleIcon />, 
                      color: POD_STATUS_COLORS.Pending 
                    },
                    { 
                      label: 'Failed', 
                      value: metrics.pods.failed, 
                      icon: <ErrorIcon />, 
                      color: POD_STATUS_COLORS.Failed 
                    },
                    { 
                      label: 'Succeeded', 
                      value: metrics.pods.succeeded, 
                      icon: <PlayArrowIcon />, 
                      color: POD_STATUS_COLORS.Succeeded 
                    },
                  ].map((status) => (
                    <Grid item xs={12} sm={6} md={3} key={status.label}>
                      <Card
                        sx={{
                          background: 'white',
                          borderRadius: 2,
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: status.color,
                            borderRadius: 2,
                            p: 1.5,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {status.icon}
                        </Box>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {status.value}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {status.label}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Fade>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

