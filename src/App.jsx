import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import SituationChat from './components/SituationChat';
import Bots from './components/Bots';
import Reports from './components/Reports';
import SubscriptionsPage from "./components/SubscriptionsPage.jsx";

// Move ProtectedRoute inside a separate component that has access to router hooks
const ProtectedRouteWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          if (!currentSession) {
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          navigate('/', { replace: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (!session) {
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Verificare autentificare...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [initializing, setInitializing] = useState(true);
  const [situations, setSituations] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Only fetch situations if we have a session
          const { data, error } = await supabase.from('situations').select('*');
          if (error) {
            console.error('Error fetching situations:', error);
          } else {
            setSituations(data);
          }
        }
      } catch (error) {
        console.error('Error in initial setup:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();
  }, []);

  if (initializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Verificare autentificare...</div>
      </div>
    );
  }

  return (
    <Router basename="/zabot">
      <Routes>
        {/* Public routes */}
        <Route path="" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRouteWrapper>
              <Dashboard />
            </ProtectedRouteWrapper>
          }
        />
        <Route
          path="/bots"
          element={
            <ProtectedRouteWrapper>
              <Bots />
            </ProtectedRouteWrapper>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRouteWrapper>
              <Reports />
            </ProtectedRouteWrapper>
          }
        />
        <Route 
          path="/situation/:id" 
          element={
            <ProtectedRouteWrapper>
              <SituationChat situations={situations} />
            </ProtectedRouteWrapper>
          } 
        />
        <Route
            path="/subscriptions"
            element={
              <ProtectedRouteWrapper>
                <SubscriptionsPage />
              </ProtectedRouteWrapper>
            }
        />
        {/* Catch all route - redirect to base path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
