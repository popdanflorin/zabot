import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabaseClient';

const LoginContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #6c5ce7, #a367dc);
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
`;

const LoginCard = styled.div`
  display: flex;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
`;

const LeftSection = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #6c5ce7, #a367dc);
  padding: 60px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    bottom: -20%;
    left: -10%;
    width: 120%;
    height: 120%;
    background: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
    transform: rotate(-15deg);
    opacity: 0.1;
    z-index: 1;
  }
`;

const RightSection = styled.div`
  flex: 1;
  background: white;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  form {
    width: 100%;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
`;

const WelcomeText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.9;
  position: relative;
  z-index: 2;
`;

const Title = styled.h2`
  color: #6c5ce7;
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.8rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 20px;
  margin: 10px 0;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  background: #f8f9fa;
  font-size: 16px;
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #adb5bd;
    opacity: 1;
  }

  &:focus {
    outline: none;
    background: #fff;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 15px;
  background: #6c5ce7;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background: #5f3dc4;
  }

  &:disabled {
    background: #a8a8a8;
    cursor: not-allowed;
  }
`;

const SignUpLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #6c5ce7;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const RememberForgotRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: #666;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: #6c5ce7;
  }
`;

const StyledCheckbox = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #e1e1e1;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:checked {
    background-color: #6c5ce7;
    border-color: #6c5ce7;

    &::after {
      content: '✓';
      position: absolute;
      color: white;
      font-size: 12px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &:hover {
    border-color: #6c5ce7;
  }
`;

const ForgotPassword = styled(Link)`
  color: #6c5ce7;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.div`
  color: #28a745;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: color 0.3s;

  &:hover {
    color: #6c5ce7;
  }

  &:focus {
    outline: none;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 15px;
  background: white;
  color: #757575;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #d1d1d1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #666;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e1e1e1;
  }

  span {
    padding: 0 10px;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Just set initialized to true, no auto-redirect
    setIsInitialized(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.');
        } else {
          setError('An error occurred during login. Please try again.');
        }
        return;
      }

      if (!data?.user) {
        setError('No user found with these credentials.');
        return;
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        setError('Please verify your email address before logging in.');
        // Sign out the user since they haven't confirmed their email
        await supabase.auth.signOut();
        return;
      }

      navigate('/chat');
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.hostname === 'localhost' 
            ? 'http://localhost:5173/zabot/chat'
            : 'https://popdanflorin.github.io/zabot/chat',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      });

      if (error) {
        console.error('Google login error:', error);
        setError('Failed to sign in with Google. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (!isInitialized) {
    return (
      <LoginContainer>
        <div style={{ color: 'white', textAlign: 'center' }}>
          Initializing...
        </div>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard>
        <LeftSection>
          <WelcomeTitle>Welcome Back!</WelcomeTitle>
          <WelcomeText>
            Sign in to continue to your account and access all our features.
            We're glad to see you again!
          </WelcomeText>
        </LeftSection>
        <RightSection>
          <Title>LOGIN</Title>
          {message && (
            <SuccessMessage>{message}</SuccessMessage>
          )}
          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}
          <GoogleButton type="button" onClick={handleGoogleLogin}>
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </GoogleButton>
          <OrDivider>
            <span>OR</span>
          </OrDivider>
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={handleChange}
              required
            />
            <InputWrapper>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={handleChange}
                required
              />
              <PasswordToggle
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </PasswordToggle>
            </InputWrapper>
            <RememberForgotRow>
              <CheckboxContainer>
                <StyledCheckbox type="checkbox" />
                Remember me
              </CheckboxContainer>
              <ForgotPassword to="/forgot-password">Forgot password?</ForgotPassword>
            </RememberForgotRow>
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'LOGIN'}
            </Button>
          </form>
          <SignUpLink to="/signup">Don't have an account? Sign up</SignUpLink>
        </RightSection>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 