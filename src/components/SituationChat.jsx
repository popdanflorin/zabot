import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateChatResponse } from '../lib/openai';
import './SituationChat.css';
import './Dashboard.css';

const SituationChat = ({ situations }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [situationDetails, setSituationDetails] = useState(null);
  const [general_prompts, setGeneralPrompts] = useState(null);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const situation = situations.find((s) => s.id === parseInt(id));

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
//
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

      setSituationDetails(data);
      setGeneralPrompts(general_prompts);

      // Start the conversation with a generated message from OpenAI
      setIsTyping(true);
      try {
        const situationContext = data.prompt + general_prompts;

        const botResponse = await generateChatResponse(
          [], // Empty messages array since this is the first message
          situationContext
        );

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

    let progressChange = 100 / situationDetails.max_messages;

    setProgress(prev => {
      const newProgress = Math.min(Math.max(prev + progressChange, 0), 100);
      // Check if we just reached 100%
      if (newProgress === 100) {
        setShowReport(true);
        setTimeLeft(0);
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
    
    return {
      totalMessages,
      userMessages,
      botMessages,
      progress,
      timeSpent: situationDetails.timer_in_minutes * 60 - timeLeft
    };
  };

  const analyzeCommunicationStyle = async (messages) => {
    try {
      const userMessages = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .join('\n');

      const conversationContext = `You are a communication analysis expert. Analyze the following conversation and provide a detailed analysis of the communication style and effectiveness.

User Messages:
${userMessages}

Situation Context:
${situation?.prompt || ''}

You must respond with a valid JSON object in this exact format:
{
  "overall_success": number (0-100),
  "assertive_percent": number (0-100),
  "aggressive_percent": number (0-100),
  "passive_percent": number (0-100),
  "dialogue_good_points":"The single most effective message that contributed to the success of the conversation. Include the exact quote and explain in a few words (max 10 words) why it was effective. The explanation must be in ROMANIAN.",
  "recommendation1": "First specific recommendation for improvement (in ROMANIAN, for the user only)",
  "recommendation2": "Second specific recommendation for improvement (in ROMANIAN, for the user only)"
}

IMPORTANT RULES:
- Return ONLY the JSON object, without any explanation, comment, or additional text.
- Do NOT include Markdown formatting, code blocks, or triple backticks.
- Make sure the JSON is WELL-FORMED and parsable by standard JSON parsers.
- All string values MUST be properly quoted using double quotes (").
- Ensure the JSON object is COMPLETE (no missing or truncated fields).
- Make sure all texts, explanations, and recommendations are in **ROMANIAN**.

Consider these aspects for the analysis:
1. Overall Success (0-100):
   - Achievement of stated goals
   - Effectiveness of communication
   - Resolution of issues
   - Professional conduct

2. Communication Styles:
   - Assertive: Clear expression of needs, respectful tone, balanced approach
   - Aggressive: Hostile tone, personal attacks, demanding language
   - Passive: Avoidance, unclear needs, excessive agreement

3. Best Message Selection:
   - Choose the single most impactful message written by the USER.
   - Consider how it advanced the conversation.
   - Look for messages that:
     * Clearly expressed needs or concerns
     * Demonstrated professional tone
     * Showed effective problem-solving
     * Led to positive outcomes
   - Include the exact quote and a short explanation in ROMANIAN of why it was effective.

4. Recommendations:
   - Must be addressed ONLY to the USER, NOT to the bot.
   - Must be based exclusively on the USER'S messages and behavior.
   - Must be written in ROMANIAN.
   - Provide practical, actionable, and specific advice the USER could apply in similar future conversations.
   - Do NOT give recommendations related to the bot or the AI model.
   - If you accidentally give advice for the bot, immediately discard it and only provide recommendations for the user.
`;

      const analysis = await generateChatResponse([], conversationContext);
      
      try {
        // Try to parse the JSON
        let metrics;
        try {
          metrics = JSON.parse(analysis);
        } catch (parseError) {
          // If parsing fails, try to extract just the JSON object
          const jsonMatch = analysis.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            metrics = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON object found in response');
          }
        }        
        // Validate the metrics object has all required fields
        const requiredFields = [
          'overall_success',
          'assertive_percent',
          'aggressive_percent',
          'passive_percent',
          'dialogue_good_points',
          'recommendation1',
          'recommendation2'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in metrics));
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // if (!Array.isArray(metrics.dialogue_good_points) || metrics.dialogue_good_points.length === 0) {
        //   metrics.dialogue_good_points = ["No effective messages found in the conversation"];
        // }
        
        return metrics;
      } catch (parseError) {
        console.error('Error parsing analysis response:', parseError);
        console.error('Failed to parse JSON:', analysis);
        throw new Error('Failed to parse analysis response as JSON');
      }
    } catch (error) {
      console.error('Error in analyzeCommunicationStyle:', error);
      return {
        overall_success: 0,
        assertive_percent: 0,
        aggressive_percent: 0,
        passive_percent: 0,
        dialogue_good_points: "Unable to analyze conversation",
        recommendation1: "Unable to generate recommendations",
        recommendation2: "Please try again later"
      };
    }
  };

  const saveUserProgress = async (metrics) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure arrays are properly formatted
      // const dialoguePoints = Array.isArray(metrics.dialogue_good_points) 
      //   ? metrics.dialogue_good_points 
      //   : [];

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          situation_id: id,
          overall_success: metrics.overall_success,
          assertive_percent: metrics.assertive_percent,
          aggressive_percent: metrics.aggressive_percent,
          passive_percent: metrics.passive_percent,
          dialogue_good_points: metrics.dialogue_good_points,
          recommendation1: metrics.recommendation1 || "No recommendation available",
          recommendation2: metrics.recommendation2 || "No recommendation available",
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

  const generateRecommendations = async (userMessages) => {
    try {
      const prompt = `Based on the following user messages, provide 2 specific recommendations to improve their communication skills. Focus on practical, actionable advice.

User Messages:
${userMessages.join('\n')}

Provide the response addresed to the user in this exact format:
{
  "recommendation1": "First recommendation",
  "recommendation2": "Second recommendation"
}`;

      const response = await generateChatResponse([], prompt);
      const recommendations = JSON.parse(response);
      return [recommendations.recommendation1, recommendations.recommendation2];
    } catch (error) {
      return ["Unable to generate recommendations", "Please try again later"];
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

        {/* Report Popup */}
        {showReport && (
          <div className="report-overlay">
            <div className="report-content">
              <h2>Raport de Conversație</h2>
              <div className="report-details">
                <div className="metrics-section">
                  <h3>Metrici de Comunicare</h3>
                  <p>Progres General: {userProgress?.overall_success || 0}%</p>
                  <p>Stil Asertiv: {userProgress?.assertive_percent || 0}%</p>
                  <p>Stil Agresiv: {userProgress?.aggressive_percent || 0}%</p>
                  <p>Stil Pasiv: {userProgress?.passive_percent || 0}%</p>
                </div>

                <div className="good-points-section">
                  <h3>Puncte Forte în Dialog</h3>
                  <p>{userProgress?.dialogue_good_points}</p>
                </div>

                <div className="recommendations-section">
                  <h3>Recomandări pentru Îmbunătățire</h3>
                  <ul>
                    <li>{userProgress?.recommendation1}</li>
                    <li>{userProgress?.recommendation2}</li>
                  </ul>
                </div>
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