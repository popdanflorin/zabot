import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChatInterface.css';

const ChatInterface = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [situations, setSituations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle selected category from navigation
  useEffect(() => {
    if (location.state?.selectedCategoryId && categories.length > 0) {
      const categoryId = location.state.selectedCategoryId;
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategory(category);
        fetchSituations(categoryId);
      }
    }
  }, [location.state?.selectedCategoryId, categories]);

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

  const fetchSituations = async (categoryId) => {
    try {
      const { data, error } = await supabase
        .from('situations')
        .select('id, bot_name')
        .eq('cid', categoryId)
        .order('difficulty');

      if (error) throw error;

      console.log('Situations:', data);
      setSituations(data);
    } catch (err) {
      console.error('Error fetching situations:', err);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSituation(null);
    fetchSituations(category.id);
  };

  const handleSituationClick = (situation) => {
    console.log('Navigating to situation:', situation.id);
    navigate(`/situation/${situation.id}`);
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

  return (
    <div className="chat-container">
      <button 
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: 'transparent',
          color: '#6c5ce7',
          border: '2px solid #6c5ce7',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(108, 92, 231, 0.1)',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#6c5ce7';
          e.target.style.color = 'white';
          e.target.style.boxShadow = '0 4px 8px rgba(108, 92, 231, 0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#6c5ce7';
          e.target.style.boxShadow = '0 2px 4px rgba(108, 92, 231, 0.1)';
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ marginRight: '4px' }}
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
      </button>

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
                  className={`category-button ${selectedCategory?.id === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category.title}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="chat-area">
          {selectedCategory ? (
            <div className="situations-list">
              <h3>Situations</h3>
              <div className="situations-grid">
                {situations.map((situation) => (
                  <button
                    key={situation.id}
                    className="situation-button"
                    onClick={() => handleSituationClick(situation)}
                  >
                    {situation.bot_name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="welcome-message">
              <h3>Welcome to the Training Interface</h3>
              <p>Please select a category from the sidebar to view available situations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 