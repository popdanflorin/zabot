import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react'
import './Dashboard.css';
import logo from "../assets/Verbo-nbg-dashboard.png";
import andrei from '../assets/01.Andrei.png';
import cristina from '../assets/02.Cristina.png';
import radu from '../assets/03.Radu.png';
import antonia from '../assets/04.Antonia.png';
import alex from '../assets/05.Alex.png';
import mihai from '../assets/06.Mihai.png';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [suggestedBots, setSuggestedBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessType, setAccessType] = useState('free');
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [trialHoursLeft, setTrialHoursLeft] = useState(null);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [hasReferred, setHasReferred] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name || user?.email);
    };

    fetchUser();
  }, []);

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
            const trialHoursLeft = Math.floor(Math.max(0, 72 - hoursSinceCreation));
            setTrialHoursLeft(trialHoursLeft);
          }
        }
      }
      setAccessType(nextAccessType);
      return nextAccessType;
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

    const fetchSuggestedBots = async (accessType) => {
      try {
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
        if (['trial', 'free'].includes(accessType)) {
          query = query.in('id', [2, 3, 5]);
        }
        query = query.limit(5);
        const { data, error } = await query;
        if (error) throw error;
        setSuggestedBots(data);
      } catch (err) {
        console.error('Error fetching suggested bots:', err);
      }
    };

    (async () => {
      const at = await getUserAndAccess();
      fetchReports();
      fetchSuggestedBots(at);
    })();
  }, []);

  useEffect(() => {
    const checkReferral = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_referral')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setHasReferred(true);
      }
    };
    checkReferral();
  }, []);

  const handleSaveReferral = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!referralName.trim()) return;

    const { error } = await supabase
      .from('user_referral')
      .insert([{ user_id: user.id, referral_name: referralName }]);

    if (!error) {
      setHasReferred(true);
      setReferralSuccess(true);
      setTimeout(() => {
        setReferralOpen(false);
        setReferralSuccess(false); // resetăm mesajul pentru data viitoare
        setReferralName(''); // resetăm inputul
      }, 2000);
    } else {
      alert("A apărut o eroare. Încearcă din nou.");
    }
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

  const cancelSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("Trebuie să fii logat pentru a anula abonamentul.");
      return;
    }

    if (!window.confirm("Ești sigur că vrei să anulezi abonamentul? Vei pierde accesul la funcționalitățile premium.")) {
      return;
    }

    try {
      const res = await fetch("https://yaltlxdrppiqlardcxwz.supabase.co/functions/v1/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: session.user.id
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Abonamentul a fost anulat cu succes.");
        window.location.reload();
      } else {
        alert("Eroare la anularea abonamentului.");
        console.error(data);
      }
    } catch (error) {
      alert("Eroare la anularea abonamentului.");
      console.error(error);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) return;

    setSubmittingFeedback(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('user_feedback').insert([
        {
          user_id: user.id,
          feedback: feedback
        }
      ]);

      if (error) throw error;

      setFeedback('');
      setFeedbackSent(true);
      setTimeout(() => {
        setFeedbackSent(false);
        setFeedbackOpen(false);
      }, 2500);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("A apărut o eroare la trimiterea feedback-ului.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openTeamModal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (!currentSub) {
        alert("Nu ai o subscripție activă de tip echipă.");
        return;
      }

      const { data: members, error } = await supabase
        .from('subscription_with_email')
        .select('user_email')
        .eq('subscription_id', currentSub.stripe_subscription_id);

      if (error) throw error;

      setTeamMembers(members || []);
      setTeamModalOpen(true);
    } catch (err) {
      console.error('Eroare la încărcarea echipei:', err);
      alert("A apărut o eroare.");
    }
  };

  const handleAddTeamMember = async (emailToAdd) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: currentSub, error: subError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (!currentSub || subError) {
        alert("Nu ai o subscripție activă.");
        return;
      }

      const { count, error: countError } = await supabase
        .from('subscriptions_teampro')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_id', currentSub.stripe_subscription_id);

      if (countError) throw countError;
      if (count >= 9) {
        alert("Ai atins limita de 10 membri în echipă.");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailToAdd)
        .single();

      if (userError || !userData) {
        alert("Nu există un utilizator cu acest email.");
        return;
      }

      const userId = userData.id;

      const { data: existing } = await supabase
        .from('subscriptions_teampro')
        .select('*')
        .eq('user_id', userId)
        .eq('subscription_id', currentSub.stripe_subscription_id);

      if (existing?.length) {
        alert("Utilizatorul este deja membru.");
        return;
      }

      const { error: insertError } = await supabase
        .from('subscriptions_teampro')
        .insert({
          user_id: userId,
          subscription_id: currentSub.stripe_subscription_id,
          plan_name: 'team pro',
          status: 'active'
        });

      if (insertError) throw insertError;

      setEmailToAdd(""); // curăță inputul
      alert("Membru adăugat cu succes!");
      openTeamModal(); // reîncarcă membrii
    } catch (err) {
      console.error("Eroare la adăugare:", err);
      alert("Eroare la adăugarea membrului.");
    }
  };

  const getBotPicture = (botId) => {
    const botPictures = {
      1: andrei,
      2: cristina,
      3: radu,
      4: antonia,
      5: alex,
      6: mihai,
    };
    return botPictures[botId];
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

      <div className="main-content">
        <div className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img
            src={logo}
            alt="VERBO Logo"
            className="logo"
          />
          <h1>{t('dashboard')}</h1>
          <select
            className="language-select"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="ro">Română</option>
            <option value="en">English</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", textAlign: "left" }}>
              <span className="user-name">
                🙍‍♂️ {userName}
              </span>
              <span className="plan-badge">
                {`${t('plan')}: ${accessType.toUpperCase()}`}
              </span>
              {accessType === 'trial' && trialHoursLeft !== null && (
                <span style={{ color: '#f87171', fontWeight: 'bold' }}>
                  ⏳ {trialHoursLeft} {trialHoursLeft === 1 ? t('hour') : t('hours')} {t('remaining_trial_hours')}
                </span>
              )}
              {(accessType === 'pro' || accessType === 'team') && (
                <button onClick={cancelSubscription} className="cancel-link">
                  {t('cancel')}
                </button>
              )}
              <Link to="/privacy-policy" className="cancel-link" target="_blank" rel="noopener noreferrer">
                {t('privacy_policy')}
              </Link>
            </div>
            {(accessType === 'free' || accessType === 'trial') && (
              <button onClick={() => navigate('/subscriptions')} className="logout-button confirm">
                {t('subscribe')}
              </button>
            )}
            {(accessType !== 'free') && (
              <button onClick={() => navigate('/leaderboard')} className="logout-button">
                {t('leaderboard_name')}
              </button>
            )}
            {accessType === 'team' && (
              <button onClick={openTeamModal} className="logout-button">
                {t('my_team')}
              </button>
            )}
            <button onClick={() => setFeedbackOpen(true)} className="logout-button">
              {t('feedback')}
            </button>
            {!hasReferred && (
              <button onClick={() => setReferralOpen(true)} className="logout-button">
                {t('community_access')}
              </button>
            )}
            <button onClick={handleLogout} className="logout-button">
              {t('logout')}
            </button>

          </div>
        </div>

        <div className="dashboard-content">
          <div className="reports-section">
            <div className="section-header">
              <h2>{t('latest_reports')}</h2>
              <a href="/reports" className="see-all-link">{t('view_all_reports')}</a>
            </div>
            <div className="reports-grid">
              {loading ? (
                <div className="loading">{t('loading_reports')}</div>
              ) : error ? (
                <div className="error">{t('error_reports')} {error}</div>
              ) : reports.length === 0 ? (
                <div className="no-reports">{t('no_reports')}</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="report-card">
                    <h3>{report.situations?.bot_name || 'Unknown Bot'}</h3>
                    <span
                      className="difficulty-badge"
                      style={{ backgroundColor: getSuccessColor(report.overall_success) }}
                    >
                      {report.overall_success}{t('success')}
                    </span>
                    <span className="report-date">
                      <Calendar size={14} style={{ marginRight: '6px' }} />
                      {formatDate(report.completed_at)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="section-header" style={{ marginTop: '40px' }}>
              <h2>{t('suggested_situations')}</h2>
              <a href="/bots" className="see-all-link">{t('view_all_situations')}</a>
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
                    style={{ backgroundColor: getDifficultyLabel(bot.difficulty).color }}
                  >
                    {getDifficultyText(bot.difficulty)}
                  </span>
                  <div className="bot-card-image">
                    <img
                      src={getBotPicture(bot.id)}
                      alt={`${bot.gender} bot`}
                    />
                  </div>
                  <div className="bot-card-category">
                    {bot.categories?.title || 'Uncategorized'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {feedbackOpen && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal-content">
            <h2>{t('leave_feedback')} 🙏</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedback_placeholder')}
            />
            {feedbackSent && <p style={{ color: "lightgreen" }}>✅ {t('feedback_thankyou')}</p>}
            <div>
              <button onClick={submitFeedback} disabled={submittingFeedback}>
                {submittingFeedback ? t('feedback_sending') : t('feedback_send')}
              </button>
              <button onClick={() => setFeedbackOpen(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
      {teamModalOpen && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal-content">
            <h2>{t('teamModal.title')} 🧑‍🤝‍🧑</h2>
            <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
              {teamMembers.length > 0 ? (
                teamMembers.map((member, index) => (
                  <input
                    key={index}
                    type="text"
                    value={member.user_email}
                    readOnly
                    style={{ width: '100%', padding: '8px' }}
                  />
                ))
              ) : (
                <p>{t('teamModal.empty')}</p>
              )}
            </div>

            {/* Formular de adăugare */}
            <div style={{ marginTop: "16px" }}>
              <input
                type="email"
                placeholder={t('teamModal.inputPlaceholder')}
                value={emailToAdd}
                onChange={(e) => setEmailToAdd(e.target.value)}
                style={{ padding: "8px", width: "100%", marginBottom: "8px" }}
              />
              <button onClick={() => handleAddTeamMember(emailToAdd)} style={{ marginRight: "8px" }}>
                {t('teamModal.addButton')}
              </button>
              <button onClick={() => setTeamModalOpen(false)}>{t('teamModal.closeButton')}</button>
            </div>
          </div>
        </div>
      )}
      {referralOpen && (
        <div className="referral-modal-overlay">
          <div className="referral-modal-content">
            <h2>{t('referralModal.title')}</h2>
            <input
              type="text"
              value={referralName}
              onChange={(e) => setReferralName(e.target.value)}
              placeholder={t('referralModal.inputPlaceholder')}
            />
            {referralSuccess && (
              <div className="referral-success-message">
                {t('referralModal.success')} 🎉
              </div>
            )}
            <div className="referral-modal-actions">
              <button onClick={handleSaveReferral}>{t('referralModal.saveButton')}</button>
              <button onClick={() => setReferralOpen(false)}>{t('referralModal.cancelButton')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 