import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [initializing, setInitializing] = useState(true);
  const [situations, setSituations] = useState([]);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      setInitializing(false);
    }

    // Fetch situations
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
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Initializing...</div>
      </div>
    );
  }

  return (
    <Router basename="/zabot">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
      </Routes>
    </Router>
  );
}

export default App;
