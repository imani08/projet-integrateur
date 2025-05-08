import React, { useEffect, useState } from 'react';
import { getUsers, assignUserRole } from '../services/api';
import { getAuth, onAuthStateChanged  } from "firebase/auth";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Snackbar
} from '@mui/material';

const predefinedRoles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'technician', label: 'Technicien' },
  { value: 'viewer', label: 'Observateur' }
];

const AdminAssignRoles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs', err);
        setError('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    if (!uid) {
      console.error("L'ID utilisateur est requis");
      setError("ID utilisateur manquant");
      return;
    }
  
    try {
      const auth = getAuth();
  
      // S'assurer que l'utilisateur est bien prêt
      const waitForUser = () =>
        new Promise((resolve, reject) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
              resolve(user);
            } else {
              reject(new Error("Utilisateur non connecté"));
            }
          });
        });
  
      const currentUser = await waitForUser();
  
      // Récupérer le token (si besoin pour l'auth backend)
      await currentUser.getIdToken(true);
  
      // ✅ Tu n'as plus besoin de vérifier idTokenResult.claims.admin si tous les utilisateurs peuvent changer
      setUpdatingUser(uid);
      await assignUserRole(uid, newRole);
  
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.uid === uid ? { ...user, role: newRole } : user
        )
      );
  
      setSuccess(`Rôle de ${users.find(u => u.uid === uid)?.email} mis à jour avec succès`);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError(`Échec: ${error.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };
  

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        🔐 Gestion des Rôles Utilisateurs
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }} aria-label="table des utilisateurs">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rôle Actuel</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nouveau Rôle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(({ uid, email, role }) => {
              if (!uid) {
                console.warn('Utilisateur sans UID:', email);
                return null;
              }

              return (
                <TableRow key={uid} hover>
                  <TableCell>{email}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {uid}
                  </TableCell>
                  <TableCell>
                    <Box 
                      sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: role ? 'primary.light' : 'grey.300',
                        color: role ? 'primary.contrastText' : 'grey.800',
                        fontWeight: 'medium'
                      }}
                    >
                      {role ? predefinedRoles.find(r => r.value === role)?.label || role : 'Non attribué'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={role || ''}
                        disabled={updatingUser === uid}
                        onChange={(e) => handleRoleChange(uid, e.target.value)}
                        displayEmpty
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">
                          <em>-- Sélectionner --</em>
                        </MenuItem>
                        {predefinedRoles.map(({ value, label }) => (
                          <MenuItem key={value} value={value}>
                            {updatingUser === uid && role === value ? (
                              <Box display="flex" alignItems="center">
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                {label}
                              </Box>
                            ) : (
                              label
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminAssignRoles;