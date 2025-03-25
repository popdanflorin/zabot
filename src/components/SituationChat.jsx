import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateChatResponse } from '../lib/openai';
import './SituationChat.css';
import './Dashboard.css';

const SituationChat = ({ situations }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [situationDetails, setSituationDetails] = useState(null);
  const [general_prompts, setGeneralPrompts] = useState(null);
  const [progress, setProgress] = useState(0); // Initial progress value
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Situations prop:', situations);
  console.log('Current ID:', id);

  const situation = situations.find((s) => s.id === parseInt(id));
  console.log('Found situation:', situation);

  useEffect(() => {
    fetchCategories();
    fetchSituationDetails();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (situationDetails?.timer_in_minutes) {
      setTimeLeft(situationDetails.timer_in_minutes * 60);
    }
  }, [situationDetails]);

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setShowReport(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft]);

  const fetchSituationDetails = async () => {
    try {
      const [situationResult, generalPromptsResult] = await Promise.all([
        supabase.from('situations').select('*').eq('id', id).single(),
        supabase.from('general_prompts').select('*').eq('is_active', 1)
      ]);

      const { data, error } = situationResult;
      const { data: general_data, error: general_error } = generalPromptsResult;

      if (error) {
        console.error('Error fetching situation:', error);
        throw error;
      }

      if (general_error) {
        console.error('Error fetching general prompts:', general_error);
        throw general_error;
      }

      // Ensure general_data is an array before mapping
      const general_prompts = general_data?.length
        ? general_data.map(item => item.prompt).join(' ')
        : '';

      console.log('Fetched situation:', data);
      console.log('Concatenated General Prompts:', general_prompts);

      setSituationDetails(data);
      setGeneralPrompts(general_prompts);

      // Start the conversation with a generated message from OpenAI
      setIsTyping(true);
      try {
        const situationContext = data.prompt + general_prompts;

        console.log('Generating initial message with context:', situationContext);

        const botResponse = await generateChatResponse(
          [], // Empty messages array since this is the first message
          situationContext
        );

        console.log('Generated bot response:', botResponse);

        const botMessage = {
          id: 0,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setMessages([botMessage]);
      } catch (err) {
        console.error('Error getting initial bot response:', err);
        setError('Failed to start the conversation. Please try refreshing the page.');
      } finally {
        setIsTyping(false);
      }
    } catch (err) {
      console.error('Error fetching situation details:', err);
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id');

      if (error) throw error;

      console.log(data);
      setCategories(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length,
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Check for keywords and update progress
    const goodKeywords = situationDetails.good_keywords?.split(',').map(k => k.trim().toLowerCase()) || [];
    const badKeywords = situationDetails.bad_keywords?.split(',').map(k => k.trim().toLowerCase()) || [];

    const messageLower = message.toLowerCase().trim();
    let progressChange = 0;

    // Log keywords for debugging
    console.log('------- Keyword Check Start -------');
    console.log('Message to check:', messageLower);
    console.log('Good keywords to look for:', goodKeywords);
    console.log('Bad keywords to look for:', badKeywords);

    // Check for good keywords (phrases)
    for (let keyword of goodKeywords) {
      keyword = keyword.trim().toLowerCase();
      console.log(`Checking good keyword: "${keyword}"`);
      console.log(`Is "${keyword}" in "${messageLower}"?`, messageLower.indexOf(keyword) !== -1);

      if (keyword && messageLower.indexOf(keyword) !== -1) {
        progressChange += 10;
        console.log(`✓ Found good keyword: "${keyword}"`);
      }
    }

    // Check for bad keywords (phrases)
    for (let keyword of badKeywords) {
      keyword = keyword.trim().toLowerCase();
      console.log(`Checking bad keyword: "${keyword}"`);
      console.log(`Is "${keyword}" in "${messageLower}"?`, messageLower.indexOf(keyword) !== -1);

      if (keyword && messageLower.indexOf(keyword) !== -1) {
        progressChange -= 10;
        console.log(`✓ Found bad keyword: "${keyword}"`);
      }
    }

    console.log('Progress change:', progressChange);
    console.log('------- Keyword Check End -------');

    setProgress(prev => {
      const newProgress = Math.min(Math.max(prev + progressChange, 0), 100);
      console.log('Progress update:', { old: prev, new: newProgress });

      // Check if we just reached 100%
      if (newProgress === 100 && prev !== 100) {
        // Add a congratulatory bot message
        const congratsMessage = {
          id: messages.length + 2,
          text: "Felicitări! Ai gestionat această situație cu succes. Ai demonstrat abilități excelente de comunicare și empatie!",
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setMessages(currentMessages => [...currentMessages, congratsMessage]);

        // Show completion overlay after a short delay
        setTimeout(() => {
          setShowCompletion(true);
        }, 1000);
      }

      return newProgress;
    });

    setMessage('');
    setIsTyping(true);

    // Get bot response using OpenAI
    try {
      const situationContext = situationDetails.prompt + general_prompts;

      const botResponse = await generateChatResponse(
        [...messages, userMessage],
        situationContext
      );

      const botMessage = {
        id: messages.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error getting bot response:', err);
      const errorMessage = {
        id: messages.length + 1,
        text: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      inputRef.current.focus();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCategoryClick = (category) => {
    navigate('/chat', { state: { selectedCategoryId: category.id } });
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateReport = () => {
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.sender === 'user').length;
    const botMessages = messages.filter(m => m.sender === 'bot').length;
    const averageResponseTime = calculateAverageResponseTime();
    
    return {
      totalMessages,
      userMessages,
      botMessages,
      progress,
      averageResponseTime,
      timeSpent: situationDetails.timer_in_minutes * 60 - timeLeft
    };
  };

  const calculateAverageResponseTime = () => {
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender === 'user' && messages[i-1].sender === 'bot') {
        const timeDiff = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
        totalTime += timeDiff;
        count++;
      }
    }
    
    return count > 0 ? Math.round(totalTime / count / 1000) : 0;
  };

  const analyzeCommunicationStyle = async (messages) => {
    try {
      // Extract only user messages
      const userMessages = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .join('\n');

      console.log('User messages for analysis:', userMessages);

      const conversationContext = `You are an expert in communication analysis. Analyze the following user messages and provide a JSON response with the following metrics:
        - overall_success: percentage (0-100) of how well the user handled the situation
        - assertive_percent: percentage (0-100) of assertive communication
        - aggressive_percent: percentage (0-100) of aggressive communication
        - passive_percent: percentage (0-100) of passive communication

        Consider these specific aspects for each communication style:

        Assertive Communication (0-100%):
        - Clear expression of needs and concerns
        - Professional tone
        - Direct but respectful communication
        - Setting appropriate boundaries
        - Asking for support in a constructive way

        Aggressive Communication (0-100%):
        - Hostile or confrontational language
        - Demanding or threatening tone
        - Disrespectful or unprofessional behavior
        - Blaming or accusatory statements
        - Overly emotional or heated responses
        - Use of aggressive words or phrases
        - Raising voice or using caps
        - Personal attacks or insults

        Passive Communication (0-100%):
        - Avoiding direct communication
        - Not expressing needs clearly
        - Being overly accommodating
        - Hesitant or uncertain language
        - Difficulty setting boundaries

        Overall Success (0-100%):
        - How effectively the user achieved their goals
        - Professional conduct
        - Problem-solving approach
        - Communication clarity
        - Relationship maintenance

        Situation Context:
        ${situationDetails.prompt}

        User Messages:
        ${userMessages}

        Provide the response in this exact JSON format:
        {
          "overall_success": number,
          "assertive_percent": number,
          "aggressive_percent": number,
          "passive_percent": number
        }`;

      console.log('Sending analysis request to OpenAI with context:', conversationContext);

      const analysis = await generateChatResponse(
        [],
        conversationContext
      );

      console.log('Raw analysis response:', analysis);

      // Parse the JSON response
      const metrics = JSON.parse(analysis);
      console.log('Parsed communication style analysis:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error analyzing communication style:', error);
      return {
        overall_success: 0,
        assertive_percent: 0,
        aggressive_percent: 0,
        passive_percent: 0
      };
    }
  };

  const saveUserProgress = async (metrics) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          situation_id: id,
          overall_success: metrics.overall_success,
          assertive_percent: metrics.assertive_percent,
          aggressive_percent: metrics.aggressive_percent,
          passive_percent: metrics.passive_percent,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setUserProgress(data);
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && showReport) {
      const generateReport = async () => {
        const metrics = await analyzeCommunicationStyle(messages);
        await saveUserProgress(metrics);
        setUserProgress(metrics);
      };
      generateReport();
    }
  }, [timeLeft, showReport, messages]);

  const handleCloseReport = () => {
    setMessages([]); // Clear messages when closing the report
    navigate('/dashboard'); // Redirect to dashboard instead of chat
  };

  if (!situationDetails) return <div>Loading situation...</div>;

  return (
    <div className="chat-container">
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
      <div className="chat-content">
        <div className="chat-header">
          <div 
            className="timer" 
            style={{ 
              '--progress': `${(timeLeft / (situationDetails.timer_in_minutes * 60)) * 100}%` 
            }}
          >
            <span>{formatTime(timeLeft)}</span>
          </div>
          <h3>{situation?.headline || 'Loading...'}</h3>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div className="progress-tooltip">
            Progress: {progress}%
          </div>
        </div>
        <div className="chat-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text}
              </div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping || !message.trim()}>
            {isTyping ? situationDetails.bot_name + ' is typing...' : 'Send'}
          </button>
        </form>
        <div className="situation-description">
          <p>{situation?.description || ''}</p>
        </div>

        {/* Completion Overlay */}
        {showCompletion && (
          <div className="completion-overlay">
            <div className="completion-message">
              <div className="completion-emoji">🎉</div>
              <h2>Felicitări!</h2>
              <p>Ai finalizat cu succes această provocare!</p>
              <p>Ai demonstrat abilități excelente de comunicare și empatie.</p>
              <button
                className="continue-button"
                onClick={() => navigate('/chat')}
              >
                Continuă cu următoarea provocare
              </button>
            </div>
          </div>
        )}

        {/* Report Popup */}
        {showReport && (
          <div className="report-overlay">
            <div className="report-content">
              <h2>Raport de Conversație</h2>
              <div className="report-details">
                <p>Progres General: {userProgress?.overall_success || 0}%</p>
                <p>Stil Asertiv: {userProgress?.assertive_percent || 0}%</p>
                <p>Stil Agresiv: {userProgress?.aggressive_percent || 0}%</p>
                <p>Stil Pasiv: {userProgress?.passive_percent || 0}%</p>
                <p>Mesaje Totale: {calculateReport().totalMessages}</p>
                <p>Mesaje Utilizator: {calculateReport().userMessages}</p>
                <p>Mesaje Bot: {calculateReport().botMessages}</p>
                <p>Timp Răspuns Mediu: {calculateReport().averageResponseTime} secunde</p>
                <p>Timp Total: {Math.floor(calculateReport().timeSpent / 60)} minute și {calculateReport().timeSpent % 60} secunde</p>
              </div>
              <button 
                className="continue-button"
                onClick={handleCloseReport}
              >
                Închide
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SituationChat; 