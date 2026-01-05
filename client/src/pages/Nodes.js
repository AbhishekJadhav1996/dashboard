import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getNodes } from '../services/api';
import { format } from 'date-fns';

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const response = await getNodes();
      setNodes(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Ready' ? 'success' : 'error';
  };

  const getRoleColor = (role) => {
    return role === 'master' ? 'primary' : 'default';
  };

  if (loading && nodes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const readyNodes = nodes.filter(n => n.status === 'Ready').length;
  const totalNodes = nodes.length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Nodes</Typography>
        <IconButton onClick={loadNodes} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Nodes</Typography>
              <Typography variant="h4">{totalNodes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Ready Nodes</Typography>
              <Typography variant="h4" color="success.main">{readyNodes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Not Ready</Typography>
              <Typography variant="h4" color="error.main">{totalNodes - readyNodes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Kubelet Version</TableCell>
              <TableCell>OS Image</TableCell>
              <TableCell>Architecture</TableCell>
              <TableCell>CPU</TableCell>
              <TableCell>Memory</TableCell>
              <TableCell>Pods Capacity</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.name}>
                <TableCell>{node.name}</TableCell>
                <TableCell>
                  <Chip
                    label={node.status}
                    color={getStatusColor(node.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={node.role}
                    color={getRoleColor(node.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{node.kubeletVersion}</TableCell>
                <TableCell>{node.osImage}</TableCell>
                <TableCell>{node.architecture}</TableCell>
                <TableCell>{node.cpu}</TableCell>
                <TableCell>{node.memory}</TableCell>
                <TableCell>{node.pods}</TableCell>
                <TableCell>
                  {node.createdAt ? format(new Date(node.createdAt), 'PPp') : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

