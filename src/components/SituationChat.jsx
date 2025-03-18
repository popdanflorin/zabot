import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateChatResponse } from '../lib/openai';
import './SituationChat.css';

const SituationChat = ({ situations }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [situationDetails, setSituationDetails] = useState(null);
  const [progress, setProgress] = useState(0); // Initial progress value
  const [showCompletion, setShowCompletion] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  
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

  const fetchSituationDetails = async () => {
    try {
      console.log('Fetching situation details for ID:', id);
      const { data, error } = await supabase
        .from('situations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching situation:', error);
        throw error;
      }

      console.log('Fetched situation details:', data);
      setSituationDetails(data);
      
      // Start the conversation with a generated message from OpenAI
      setIsTyping(true);
      try {
        const situationContext = `You are ${data.bot_name || 'Customer'}, an angry customer. ${data.prompt || 'You are upset about a service issue.'}
          Start the conversation by expressing your frustration about the situation. Be angry but remain realistic.`;
        
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
      const situationContext = `You are ${situationDetails.bot_name}, an angry customer. ${situationDetails.prompt}
        Maintain your role as an angry customer, but react appropriately to the user's attempts to resolve the situation. If they handle the situation well, you can gradually become less angry.`;
      
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

  if (!situationDetails) return <div>Loading situation...</div>;

  return (
    <div className="chat-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button className="hamburger-button" onClick={toggleSidebar}>
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        <div className="sidebar-content">
          <h2>Categories</h2>
          <div className="category-buttons">
            {loading ? (
              <div className="loading">Loading categories...</div>
            ) : error ? (
              <div className="error">Error loading categories</div>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  className="category-button"
                  onClick={() => handleCategoryClick(category)}
                >
                  {category.title}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="chat-content">
        <h3>{situationDetails?.headline || 'Loading...'}</h3>
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
    </div>
  );
};

export default SituationChat; 