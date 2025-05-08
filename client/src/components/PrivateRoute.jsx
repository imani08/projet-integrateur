import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Spinner, Container, Alert } from 'react-bootstrap';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = React.useState(null);
  const [roleLoading, setRoleLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setUserRole(userDoc.exists() ? userDoc.data().role : "viewer");
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("viewer");
        }
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Accès non autorisé</Alert.Heading>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </Alert>
      </Container>
    );
  }

  return children;
};

export default PrivateRoute;