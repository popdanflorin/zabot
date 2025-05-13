import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabaseClient';
import logo from "../assets/Verbo-nbg.png";

const ResetContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #6c5ce7, #a367dc);
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 1em;
  }
`;

const ResetCard = styled.div`
  display: flex;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-direction: column;
    box-shadow: none;
    overflow-y: auto;
  }
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

  @media (max-width: 768px) {
    padding: 40px 20px;
    min-height: auto;
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

  @media (max-width: 768px) {
    padding: 30px 20px;
    min-height: auto;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const WelcomeText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.9;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 20px;
  }
`;

const Title = styled.h2`
  color: #6c5ce7;
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.8rem;
`;

const Subtitle = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1rem;
  line-height: 1.5;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
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
    background: #ccc;
    cursor: not-allowed;
  }
`;

const BackToLogin = styled(Link)`
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

const SuccessMessage = styled.div`
  background-color: #4caf50;
  color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ErrorMessage = styled.div`
  background-color: #f44336;
  color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const PasswordRequirements = styled.div`
  background: #f8f9fa;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  padding: 15px;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
`;

const RequirementItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
  color: ${props => props.met ? '#28a745' : '#666'};
  
  &::before {
    content: '${props => props.met ? '✓' : '•'}';
    color: ${props => props.met ? '#28a745' : '#666'};
  }
`;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Password validation functions
  const hasLowercase = (password) => /[a-z]/.test(password);
  const hasUppercase = (password) => /[A-Z]/.test(password);
  const hasDigit = (password) => /[0-9]/.test(password);
  const hasSymbol = (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/', { 
          state: { 
            message: 'Password has been reset successfully. Please login with your new password.' 
          } 
        });
      }, 3000);
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetContainer>
      <ResetCard>
        <LeftSection>
          <WelcomeTitle>Reset Password</WelcomeTitle>
          <WelcomeText>
            Please enter your new password below. Make sure it's secure and easy to remember!
          </WelcomeText>
        </LeftSection>
        <RightSection>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '-40px',
            marginLeft: '-10px',
            width: '100%'
          }}>
            <img
                src={logo}
                alt="VERBO Logo"
                style={{
                  marginTop: '15px',
                  height: '200px',
                  objectFit: 'contain'
                }}
            />
            <Title style={{margin: 0}}>RESET PASSWORD</Title>
          </div>
          <Subtitle>
            Enter your new password below
          </Subtitle>
          <SuccessMessage visible={success}>
            Password has been reset successfully! Redirecting to login...
          </SuccessMessage>
          <ErrorMessage visible={!!error}>
            {error}
          </ErrorMessage>
          <form onSubmit={handleSubmit}>
            <InputWrapper>
              <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => togglePasswordVisibility('password')}
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
            {showPasswordRequirements && (
              <PasswordRequirements>
                <RequirementItem met={hasLowercase(formData.password)}>
                  At least one lowercase letter
                </RequirementItem>
                <RequirementItem met={hasUppercase(formData.password)}>
                  At least one uppercase letter
                </RequirementItem>
                <RequirementItem met={hasDigit(formData.password)}>
                  At least one number
                </RequirementItem>
                <RequirementItem met={hasSymbol(formData.password)}>
                  At least one special character (!@#$%^&amp;*(),.?":{}|&lt;&gt;)
                </RequirementItem>
              </PasswordRequirements>
            )}
            <InputWrapper>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'RESET PASSWORD'}
            </Button>
          </form>
          <BackToLogin to="/">Back to Login</BackToLogin>
        </RightSection>
      </ResetCard>
    </ResetContainer>
  );
};

export default ResetPassword; 