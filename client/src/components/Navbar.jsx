import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import PropTypes from 'prop-types';

// Material-UI Components
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Badge,
  useMediaQuery,
  useTheme,
  Divider,
  Stack
} from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import SensorsIcon from '@mui/icons-material/Sensors';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SpaIcon from '@mui/icons-material/Spa';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EngineeringIcon from '@mui/icons-material/Engineering';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Styles
import { styled, alpha } from '@mui/material/styles';

const DarkAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(to right, ${theme.palette.grey[900]}, ${theme.palette.grey[800]})`,
  boxShadow: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  margin: theme.spacing(0, 1),
  padding: theme.spacing(1, 2),
  borderRadius: '8px',
  textTransform: 'none',
  letterSpacing: '0.5px',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    transform: 'translateY(-2px)'
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1)
  }
}));

const AppNavbar = ({ brandName = "Agriculture Intelligente" }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      
       if (user) {
      console.log("✅ Utilisateur connecté :", user.uid);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("📄 Données utilisateur récupérées :", data);

          const role = data?.role;
          if (typeof role === "string") {
            setUserRole(role);
            console.log("✅ Rôle attribué :", role);
          } else {
            console.warn("⚠️ Champ 'role' manquant ou invalide :", role);
            setUserRole("viewer");
          }
        } else {
          console.warn("⚠️ Document utilisateur non trouvé pour :", user.uid);
          setUserRole("viewer");
        }
      } catch (error) {
        console.error("❌ Erreur Firestore :", error);
        setUserRole("viewer");
      }
    } else {
      console.log("🔒 Aucun utilisateur connecté.");
      setUserRole(null);
    }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getNavLinks = () => {
    const baseLinks = [
      { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
      { to: "/about", label: "À propos", icon: <InfoIcon /> }
    ];

    if (!userRole) return [];

    switch(userRole) {
      case "admin":
        return [
          ...baseLinks,
          { to: "/sensors", label: "Capteurs", icon: <SensorsIcon /> },
          { to: "/actuators", label: "Actionneurs", icon: <SettingsIcon /> },
          { to: "/roles", label: "Utilisateurs", icon: <PeopleIcon /> },
        ];
      case "manager":
        return [
          ...baseLinks,
          { to: "/sensors", label: "Capteurs", icon: <SensorsIcon /> },
          { to: "/actuators", label: "Actionneurs", icon: <SettingsIcon /> },
        ];
      case "technician":
        return [
          ...baseLinks,
          { to: "/sensors", label: "Capteurs", icon: <SensorsIcon /> },
          { to: "/actuators", label: "Actionneurs", icon: <SettingsIcon /> },
        ];
      case "viewer":
        return baseLinks;
      default:
        return baseLinks;
    }
  };

  const navLinks = getNavLinks();

  const getRoleIcon = () => {
    if (!userRole) return null;
    
    switch(userRole) {
      case "admin":
        return <AdminPanelSettingsIcon sx={{ color: theme.palette.error.main }} />;
      case "manager":
        return <EngineeringIcon sx={{ color: theme.palette.warning.main }} />;
      case "technician":
        return <SettingsIcon sx={{ color: theme.palette.info.main }} />;
      case "viewer":
        return <VisibilityIcon sx={{ color: theme.palette.success.main }} />;
      default:
        return <VisibilityIcon />;
    }
  };

  const formatRoleName = (role) => {
    if (!role) return "";
    
    switch(role) {
      case "admin": return "Admin";
      case "manager": return "Manager";
      case "technician": return "Technicien";
      case "viewer": return "Viewer";
      default: return role;
    }
  };

  if (loading) {
    return null;
  }

  return (
    <DarkAppBar position="sticky" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box 
            component={Link} 
            to={isAuthenticated ? "/dashboard" : "/"} 
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              mr: 3
            }}
          >
            <SpaIcon sx={{ 
              color: theme.palette.success.light, 
              fontSize: 32,
              mr: 1.5,
              filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))'
            }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                color: theme.palette.common.white,
                letterSpacing: '1px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontFamily: '"Montserrat", sans-serif'
              }}
            >
              {brandName}
            </Typography>
          </Box>

          {!isMobile && isAuthenticated && userRole && (
            <Box sx={{ flexGrow: 1, display: 'flex', ml: 3 }}>
              {navLinks.map((link) => (
                <NavButton
                  key={link.to}
                  component={Link}
                  to={link.to}
                  startIcon={link.icon}
                  sx={{ 
                    minWidth: 'auto',
                    display: { xs: 'none', md: 'flex' }
                  }}
                >
                  {link.label}
                </NavButton>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                {userRole && userRole !== "viewer" && (
                  <IconButton 
                    component={Link} 
                    to="/alerts" 
                    color="inherit"
                    sx={{ 
                      mx: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.1)
                      }
                    }}
                  >
                    <Badge badgeContent={5} color="error" overlap="circular">
                      <NotificationsIcon sx={{ fontSize: 26 }} />
                    </Badge>
                  </IconButton>
                )}

                {isMobile ? (
                  <>
                    <IconButton onClick={handleMenuOpen} color="inherit">
                      <Box 
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}
                      >
                        {getRoleIcon()}
                      </Box>
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleMenuClose}
                      PaperProps={{
                        elevation: 4,
                        sx: {
                          background: theme.palette.grey[800],
                          color: theme.palette.common.white,
                          mt: 1.5,
                          minWidth: 200,
                          '& .MuiDivider-root': {
                            borderColor: alpha(theme.palette.common.white, 0.1)
                          }
                        },
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      {navLinks.map((link) => (
                        <MenuItem 
                          key={link.to} 
                          component={Link} 
                          to={link.to}
                          onClick={handleMenuClose}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.common.white, 0.1)
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(link.icon, { sx: { mr: 1.5, color: theme.palette.primary.light } })}
                            <Typography variant="body1">{link.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                      <Divider />
                      <MenuItem 
                        onClick={handleLogout}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2)
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LogoutIcon sx={{ mr: 1.5, color: theme.palette.error.light }} />
                          <Typography variant="body1">Déconnexion</Typography>
                        </Box>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    {userRole && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        {getRoleIcon()}
                        <Typography 
                          variant="subtitle1" 
                          color="inherit" 
                          sx={{ 
                            fontWeight: 500,
                            ml: 1
                          }}
                        >
                          {formatRoleName(userRole)}
                        </Typography>
                      </Box>
                    )}
                    <IconButton 
                      onClick={handleLogout} 
                      color="inherit"
                      title="Déconnexion"
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2)
                        }
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                  </Stack>
                )}
              </>
            ) : (
              <NavButton
                component={Link}
                to="/login"
                startIcon={<LoginIcon />}
                variant="outlined"
                sx={{
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Typography variant="button" fontWeight="500">
                  Connexion
                </Typography>
              </NavButton>
            )}
          </Box>
        </Toolbar>
      </Container>
    </DarkAppBar>
  );
};

AppNavbar.propTypes = {
  brandName: PropTypes.string
};

export default AppNavbar;