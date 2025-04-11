import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import { Calendar } from 'lucide-react'

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [suggestedBots, setSuggestedBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            *,
            situations (
              bot_name
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);

        if (progressError) throw progressError;
        setReports(progressData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSuggestedBots = async () => {
      try {
        const { data, error } = await supabase
          .from('situations')
          .select('*')
          .limit(5);

        if (error) throw error;
        setSuggestedBots(data);
      } catch (err) {
        console.error('Error fetching suggested bots:', err);
      }
    };

    getUser();
    fetchReports();
    fetchSuggestedBots();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return new Date(dateString).toLocaleString('ro-RO', options);
  };

  const getSuccessColor = (success) => {
    if (success >= 80) return '#4ade80'; // green
    if (success >= 60) return '#fbbf24'; // yellow
    return '#f87171'; // red
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 0:
        return 'Easy';
      case 1:
        return 'Medium';
      case 2:
        return 'Hard';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="dashboard-container">
      <button className="hamburger-button" onClick={toggleSidebar}>
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
          <div className="nav-buttons">
            <button 
              className={`nav-button ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-button ${location.pathname === '/bots' ? 'active' : ''}`}
              onClick={() => navigate('/bots')}
            >
              Bots
            </button>
            <button 
              className={`nav-button ${location.pathname === '/reports' ? 'active' : ''}`}
              onClick={() => navigate('/reports')}
            >
              Reports
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="dashboard-content">
          <div className="reports-section">
            <div className="section-header">
              <h2>Most Recent Reports</h2>
              <a href="/zabot/reports" className="see-all-link">See All Reports</a>
            </div>
            <div className="reports-grid">
              {loading ? (
                <div className="loading">Loading reports...</div>
              ) : error ? (
                <div className="error">Error loading reports: {error}</div>
              ) : reports.length === 0 ? (
                <div className="no-reports">No reports available yet. Complete some situations to see your progress!</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="report-card">
                    <h3>{report.situations?.bot_name || 'Unknown Bot'}</h3>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getSuccessColor(report.overall_success) }}
                    >
                      {report.overall_success}% Success
                    </span>
                    <span className="report-date">
                      <Calendar size={14} style={{ marginRight: '6px' }} />
                      {formatDate(report.completed_at)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="section-header" style={{ marginTop: '40px' }}>
              <h2>Suggested Bots</h2>
              <a href="/zabot/bots" className="see-all-link">See All Bots</a>
            </div>
            <div className="reports-grid">
              {suggestedBots.map((bot) => (
                <div 
                  key={bot.id} 
                  className="report-card"
                  onClick={() => navigate(`/situation/${bot.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{bot.bot_name}</h3>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: '#6c5ce7' }}
                  >
                    {getDifficultyText(bot.difficulty)}
                  </span>
                  <span className="report-date">{bot.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 