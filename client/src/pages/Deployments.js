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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getDeployments, getNamespaces } from '../services/api';
import { format } from 'date-fns';

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadDeployments();
    }
  }, [selectedNamespace]);

  const loadNamespaces = async () => {
    try {
      const response = await getNamespaces();
      setNamespaces(response.data);
      if (response.data.length > 0 && !selectedNamespace) {
        setSelectedNamespace(response.data[0].name);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadDeployments = async () => {
    setLoading(true);
    try {
      const response = await getDeployments(selectedNamespace);
      setDeployments(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (available, replicas) => {
    if (available === replicas) return 'success';
    if (available > 0) return 'warning';
    return 'error';
  };

  if (loading && deployments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Deployments</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Namespace</InputLabel>
            <Select
              value={selectedNamespace}
              label="Namespace"
              onChange={(e) => setSelectedNamespace(e.target.value)}
            >
              {namespaces.map((ns) => (
                <MenuItem key={ns.name} value={ns.name}>
                  {ns.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={loadDeployments} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Replicas</TableCell>
              <TableCell>Available</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deployments.map((deploy) => (
              <TableRow key={`${deploy.namespace}-${deploy.name}`}>
                <TableCell>{deploy.name}</TableCell>
                <TableCell>{deploy.namespace}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography>{deploy.availableReplicas}/{deploy.replicas}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(deploy.availableReplicas / deploy.replicas) * 100}
                      sx={{ width: 100, height: 8, borderRadius: 1 }}
                      color={getAvailabilityColor(deploy.availableReplicas, deploy.replicas)}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={deploy.availableReplicas}
                    color={getAvailabilityColor(deploy.availableReplicas, deploy.replicas)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{deploy.image}</TableCell>
                <TableCell>
                  {deploy.createdAt ? format(new Date(deploy.createdAt), 'PPp') : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

