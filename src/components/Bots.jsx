import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import maleBotPicture from '../assets/male_bot_picture-Photoroom.png';
import femaleBotPicture from '../assets/female_bot_picture-Photoroom.png';
import logo from "../assets/Verbo-nbg-dashboard.png";

const Bots = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessType, setAccessType] = useState('free'); // 'free', 'trial', or 'pro'
  const [totalBotsCount, setTotalBotsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUserAndBots = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      let nextAccessType = 'free';
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subscription && subscription.status === 'active') {
          nextAccessType = subscription.plan_name;
        }
        else {
          const userCreatedAt = new Date(user.created_at);
          const now = new Date();
          const hoursSinceCreation = (now - userCreatedAt) / (1000 * 60 * 60);
          if (hoursSinceCreation <= 72) {
            nextAccessType = 'trial';
          }
        }
      }
      setAccessType(nextAccessType);

      // Now fetch bots with the correct accessType
      try {
        setLoading(true);
        let query = supabase
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

        if (nextAccessType === 'free' || nextAccessType === 'trial') {
          query = query.in('id', [2, 3, 5]);
        }

        const { data: situations, error: situationsError } = await query;
        if (situationsError) throw situationsError;
        setBots(situations);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching bots:', err);
      } finally {
        setLoading(false);
      }
    };

    getUserAndBots();
  }, []);

  // Fetch total bots count once
  useEffect(() => {
    const fetchTotalBotsCount = async () => {
      const { data, error } = await supabase
        .from('situations')
        .select('id', { count: 'exact', head: true });
      if (!error && data) {
        setTotalBotsCount(data.length || 0);
      } else if (!error && data === null) {
        // If using count: 'exact', head: true, data is null, so fetch count from meta
        const { count, error: countError } = await supabase
          .from('situations')
          .select('*', { count: 'exact', head: true });
        if (!countError) setTotalBotsCount(count || 0);
      }
    };
    fetchTotalBotsCount();
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

  const navigateToSubscriptions = () => {
    navigate('/subscriptions');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
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
              Situații
            </button>
            <button
              className={`nav-button ${location.pathname === '/reports' ? 'active' : ''}`}
              onClick={() => navigate('/reports')}
            >
              Rapoarte
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img
            src={logo}
            alt="VERBO Logo"
            style={{ height: '150px', marginLeft: '20px' }}
          />
          <h1>Situații</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={goToDashboard} className="logout-button">
              Înapoi la Dashboard
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="reports-section">
            <div className="section-header">
              <h2>Situații disponibile</h2>
              {!['pro', 'team', 'team pro'].includes(accessType) && (
                <div className="upgrade-message">
                  {accessType === 'trial' ? (
                    <p>Ești în perioada de probă! Fă upgrade la Pro pentru a debloca toate situațiile.</p>
                  ) : (
                    <p>Deblochează încă {Math.max(totalBotsCount - 3, 0)} situații făcând upgrade la versiunea Pro!</p>
                  )}
                </div>
              )}
            </div>
            <div className="bots-grid">
              {loading ? (
                <div className="loading">Încărcare situații...</div>
              ) : error ? (
                <div className="error">Eroare încărcare situații: {error}</div>
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