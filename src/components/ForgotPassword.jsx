import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabaseClient';
import logo from "../assets/Verbo-nbg.png";

const ForgotContainer = styled.div`
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

const ForgotCard = styled.div`
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

    @media (max-width: 768px) {
    padding: 40px 20px;
    min-height: auto;
  }
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/zabot/reset-password`,
      });

      if (error) {
        if (error.message.includes('Email not found')) {
          setError('No account found with this email address');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotContainer>
      <ForgotCard>
        <LeftSection>
          <WelcomeTitle>Reset Password</WelcomeTitle>
          <WelcomeText>
            Don't worry! It happens to the best of us. Enter your email address and
            we'll send you instructions to reset your password.
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
            <Title style={{margin: 0}}>FORGOT PASSWORD</Title>
          </div>
          <Subtitle>
            Enter your email address below and we'll send you a link to reset your password
          </Subtitle>
          <SuccessMessage visible={success}>
            Password reset instructions have been sent to your email!
          </SuccessMessage>
          <ErrorMessage visible={!!error}>
            {error}
          </ErrorMessage>
          <form onSubmit={handleSubmit}>
            <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'SEND RESET LINK'}
            </Button>
          </form>
          <BackToLogin to="/">Back to Login</BackToLogin>
        </RightSection>
      </ForgotCard>
    </ForgotContainer>
  );
};

export default ForgotPassword; 