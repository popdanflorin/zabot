import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import './Leaderboard.css';

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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

        // sortare descrescătoare după scor
        const sortedData = [...filteredData].sort(
          (a, b) => b.overall_success - a.overall_success
        );

        const usedScores = new Set();
        const adjustedData = sortedData.map(entry => {
          let score = Math.round(entry.overall_success);

          // dacă scorul există deja, căutăm un nou scor liber (+1 sau -1)
          while (usedScores.has(score)) {
            if (score > 0) {
              score -= 1; // scădem
            } else {
              score += 1; // dacă ajunge la 0, creștem
            }
          }

          usedScores.add(score);
          return { ...entry, overall_success: score };
        });

        setData(adjustedData);
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
              {t('nav.dashboard')}
            </button>
            <button
              className={`nav-button ${location.pathname === '/bots' ? 'active' : ''}`}
              onClick={() => navigate('/bots')}
            >
              {t('nav.situations')}
            </button>
            <button
              className={`nav-button ${location.pathname === '/reports' ? 'active' : ''}`}
              onClick={() => navigate('/reports')}
            >
              {t('nav.reports')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">🏆 {t('leaderboard.title')}</h1>

        {loading ? (
          <p className="leaderboard-loading">{t('leaderboard.loading')}</p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('leaderboard.email')}</th>
                <th>{t('leaderboard.score')}</th>
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
                      <td>{entry.email || t('leaderboard.unknown')}</td>
                      <td>{entry.overall_success}</td>
                    </tr>
                  );
                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan="3" className="leaderboard-empty">
                    {t('leaderboard.empty')}
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