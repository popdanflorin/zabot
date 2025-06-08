import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import { Calendar } from 'lucide-react';
import logo from "../assets/Verbo-nbg-dashboard.png";

const Reports = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessType, setAccessType] = useState('free'); // 'free', 'trial', 'pro'
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUserAndAccess = async () => {
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
        const { data: subscription_teampro } = await supabase
          .from('subscriptions_teampro')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if ((subscription && subscription.status === 'active') ||
          (subscription_teampro && subscription_teampro.status === 'active')
        ) {
          nextAccessType =
            subscription?.status === 'active'
              ? subscription.plan_name
              : subscription_teampro?.plan_name;
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
          .order('completed_at', { ascending: false });

        if (progressError) throw progressError;
        setReports(progressData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    getUserAndAccess();
    fetchReports();
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

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuccessColor = (success) => {
    if (success >= 80) return '#4ade80'; // green
    if (success >= 60) return '#fbbf24'; // yellow
    return '#f87171'; // red
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
          <h1>Rapoarte</h1>
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
              <h2>Rapoartele tale</h2>
            </div>
            <div className="bots-grid">
              {loading ? (
                <div className="loading">Se încarcă rapoartele...</div>
              ) : error ? (
                <div className="error">Eroare la încărcarea rapoartelor: {error}</div>
              ) : reports.length === 0 ? (
                <div className="no-reports">Nu este niciun raport disponibil momentan. Completează situații ca să vezi
                  progresul tău!</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className={`bot-card${accessType === 'free' ? ' free-access' : ''}`}>
                    <div className="bot-card-content">
                      <div className="bot-card-header">
                        <div className="bot-info">
                          <h3>{report.situations?.bot_name || 'Unknown Bot'}</h3>
                          <div className="report-date">
                            <Calendar size={14} style={{ marginRight: '6px' }} />
                            {formatDate(report.completed_at)}
                          </div>
                        </div>

                        <span
                          className="difficulty-badge"
                          style={{ backgroundColor: getSuccessColor(report.overall_success) }}
                        >
                          {report.overall_success}% Success
                        </span>
                      </div>
                      {accessType !== 'free' ? (
                        <div className="report-details">
                          <div className="report-metrics">
                            <h4>Metrici de comunicare:</h4>
                            <p>Asertiv: {report.assertive_percent}%</p>
                            <p>Agresiv: {report.aggressive_percent}%</p>
                            <p>Pasiv: {report.passive_percent}%</p>
                          </div>
                          <div className="report-good-points">
                            <h4>Puncte Forte:</h4>
                            <p>{report.dialogue_good_points}</p>
                          </div>
                          <div className="report-recommendations">
                            <h4>Recomandări:</h4>
                            <ul>
                              <li>{report.recommendation1}</li>
                              <li>{report.recommendation2}</li>
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;