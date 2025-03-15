import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChatInterface from './components/ChatInterface';
import SituationChat from './components/SituationChat';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = window.location.pathname;

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Protected Route - Session check:', currentSession);
        
        if (mounted) {
          setSession(currentSession);
          if (!currentSession) {
            console.log('No active session, redirecting from:', location);
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
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
        console.log('Auth state changed in ProtectedRoute:', session);
        setSession(session);
        if (!session) {
          console.log('Session ended, redirecting from:', location);
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
    console.log('No session in ProtectedRoute render, redirecting from:', location);
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [initializing, setInitializing] = useState(true);
  const [situations, setSituations] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', currentSession);
        setSession(currentSession);
      } catch (error) {
        console.error('Error checking initial session:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only fetch situations if we have a session
  useEffect(() => {
    if (session) {
      const fetchSituations = async () => {
        try {
          const { data, error } = await supabase
            .from('situations')
            .select('*');

          if (error) {
            console.error('Error fetching situations:', error);
          } else {
            console.log('Fetched situations:', data);
            setSituations(data);
          }
        } catch (err) {
          console.error('Error in fetchSituations:', err);
        }
      };

      fetchSituations();
    }
  }, [session]);

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
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatInterface />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/situation/:id" 
          element={
            <ProtectedRoute>
              <SituationChat situations={situations} />
            </ProtectedRoute>
          } 
        />

        {/* Catch all route - redirect to base path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
