import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box,
  Typography,
  Button,
  Container,
  useTheme
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Unauthorized = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          p: 4
        }}
      >
        <LockIcon 
          sx={{ 
            fontSize: 80, 
            color: theme.palette.error.main,
            mb: 3
          }} 
        />
        
        <Typography 
          variant="h4" 
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary
          }}
        >
          Accès non autorisé
        </Typography>
        
        <Typography 
          variant="body1"
          sx={{
            mb: 4,
            color: theme.palette.text.secondary
          }}
        >
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          <br />
          Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to="/dashboard"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Retour au tableau de bord
          </Button>
          
          <Button
            component={Link}
            to="/about"
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            A propos
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Unauthorized;