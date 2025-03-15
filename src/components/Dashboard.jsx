import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabaseClient';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #6c5ce7, #a367dc);
  padding: 20px;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const WelcomeText = styled.h1`
  color: #6c5ce7;
  margin: 0;
`;

const LogoutButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #5f3dc4;
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <WelcomeText>Welcome, {user?.email}</WelcomeText>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </DashboardHeader>
      <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>
        <h2>Dashboard Content</h2>
        <p>This is your protected dashboard page.</p>
      </div>
    </DashboardContainer>
  );
};

export default Dashboard; 