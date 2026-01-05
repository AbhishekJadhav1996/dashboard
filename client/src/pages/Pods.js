import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getPods, getNamespaces, deletePod } from '../services/api';
import { format } from 'date-fns';

export default function Pods() {
  const [pods, setPods] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, pod: null });
  const navigate = useNavigate();

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadPods();
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

  const loadPods = async () => {
    setLoading(true);
    try {
      const response = await getPods(selectedNamespace);
      setPods(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePod(deleteDialog.pod.namespace, deleteDialog.pod.name);
      setDeleteDialog({ open: false, pod: null });
      loadPods();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
        return 'error';
      case 'Succeeded':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && pods.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Pods</Typography>
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
          <IconButton onClick={loadPods} color="primary">
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
              <TableCell>Status</TableCell>
              <TableCell>Node</TableCell>
              <TableCell>Containers</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pods.map((pod) => (
              <TableRow key={`${pod.namespace}-${pod.name}`}>
                <TableCell>{pod.name}</TableCell>
                <TableCell>{pod.namespace}</TableCell>
                <TableCell>
                  <Chip
                    label={pod.status}
                    color={getStatusColor(pod.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{pod.node || 'N/A'}</TableCell>
                <TableCell>
                  {pod.containers?.length || 0} ({pod.containers?.filter(c => c.ready).length || 0} ready)
                </TableCell>
                <TableCell>
                  {pod.createdAt ? format(new Date(pod.createdAt), 'PPp') : 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/pods/${pod.namespace}/${pod.name}`)}
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, pod })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, pod: null })}>
        <DialogTitle>Delete Pod</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete pod "{deleteDialog.pod?.name}" in namespace "{deleteDialog.pod?.namespace}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, pod: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

