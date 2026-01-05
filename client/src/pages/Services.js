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
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getServices, getNamespaces } from '../services/api';
import { format } from 'date-fns';

export default function Services() {
  const [services, setServices] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadServices();
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

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await getServices(selectedNamespace);
      setServices(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'ClusterIP':
        return 'default';
      case 'NodePort':
        return 'primary';
      case 'LoadBalancer':
        return 'success';
      case 'ExternalName':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && services.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Services</Typography>
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
          <IconButton onClick={loadServices} color="primary">
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
              <TableCell>Type</TableCell>
              <TableCell>Cluster IP</TableCell>
              <TableCell>Ports</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={`${service.namespace}-${service.name}`}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.namespace}</TableCell>
                <TableCell>
                  <Chip
                    label={service.type}
                    color={getTypeColor(service.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{service.clusterIP || 'N/A'}</TableCell>
                <TableCell>
                  {service.ports?.map((port, idx) => (
                    <Chip
                      key={idx}
                      label={`${port.port}${port.targetPort ? `:${port.targetPort}` : ''}${port.protocol ? `/${port.protocol}` : ''}`}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  )) || 'N/A'}
                </TableCell>
                <TableCell>
                  {service.createdAt ? format(new Date(service.createdAt), 'PPp') : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

