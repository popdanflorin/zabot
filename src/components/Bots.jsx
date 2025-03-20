import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import maleBotPicture from '../assets/male_bot_picture-Photoroom.png';
import femaleBotPicture from '../assets/female_bot_picture-Photoroom.png';

const Bots = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    const fetchBots = async () => {
      try {
        setLoading(true);
        const { data: situations, error: situationsError } = await supabase
          .from('situations')
          .select(`
            id,
            bot_name,
            difficulty,
            gender,
            categories (
              title
            )
          `)
          .order('difficulty');

        if (situationsError) throw situationsError;
        setBots(situations);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching bots:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
    fetchBots();
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

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 0:
        return { label: 'Easy', color: '#4ade80' }; // green
      case 1:
        return { label: 'Medium', color: '#fbbf24' }; // yellow
      case 2:
        return { label: 'Hard', color: '#f87171' }; // red
      default:
        return { label: 'Unknown', color: '#9ca3af' }; // gray
    }
  };

  const getBotPicture = (gender) => {
    return gender === 'male' ? maleBotPicture : femaleBotPicture;
  };

  const handleBotClick = (botId) => {
    navigate(`/situation/${botId}`);
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
          <h1>Bots</h1>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="dashboard-content">
          <div className="reports-section">
            <div className="section-header">
              <h2>Available Bots</h2>
            </div>
            <div className="bots-grid">
              {loading ? (
                <div className="loading">Loading bots...</div>
              ) : error ? (
                <div className="error">Error loading bots: {error}</div>
              ) : (
                bots.map((bot) => {
                  const difficulty = getDifficultyLabel(bot.difficulty);
                  return (
                    <div 
                      key={bot.id} 
                      className="bot-card"
                      onClick={() => handleBotClick(bot.id)}
                    >
                      <div className="bot-card-image">
                        <img 
                          src={getBotPicture(bot.gender)} 
                          alt={`${bot.gender} bot`}
                        />
                      </div>
                      <div className="bot-card-content">
                        <div className="bot-card-header">
                          <h3>{bot.bot_name}</h3>
                          <span 
                            className="difficulty-badge"
                            style={{ backgroundColor: difficulty.color }}
                          >
                            {difficulty.label}
                          </span>
                        </div>
                        <div className="bot-card-category">
                          {bot.categories?.title || 'Uncategorized'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bots; 