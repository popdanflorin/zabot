import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Leaderboard.css';

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('overall_success', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leaderboard:', error.message);
      } else {
        const filteredData = data.filter(entry => entry.overall_success !== null);
        setData(filteredData);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar Toggle Button */}
      <button className="hamburger-button" onClick={toggleSidebar}>
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Sidebar Navigation */}
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

      {/* Main Content */}
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">🏆 Leaderboard</h1>

        {loading ? (
          <p className="leaderboard-loading">Loading...</p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Score</th>
              </tr>
            </thead>
            {data && data.length > 0 ? (
              <tbody>
                {data.map((entry, index) => {
                  const rankClass =
                    index === 0 ? 'gold' :
                    index === 1 ? 'silver' :
                    index === 2 ? 'bronze' : '';

                  return (
                    <tr key={entry.email ?? `row-${index}`}>
                      <td className={`leaderboard-rank ${rankClass}`}>
                        {index === 0 ? '🥇' :
                         index === 1 ? '🥈' :
                         index === 2 ? '🥉' : index + 1}
                      </td>
                      <td>{entry.email || 'Unknown'}</td>
                      <td>{entry.overall_success}</td>
                    </tr>
                  );
                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan="3" className="leaderboard-empty">
                    Nu sunt date disponibile.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;