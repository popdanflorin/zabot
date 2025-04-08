import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabaseClient';

const SignUpContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #6c5ce7, #a367dc);
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;

  @media (max-width: 768px) {
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 1em;
  }
`;

const SignUpCard = styled.div`
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

const LoginLink = styled(Link)`
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

const PhoneInputGroup = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  margin: 10px 0;
`;

const CountrySelect = styled.select`
  width: 120px;
  padding: 15px;
  padding-left: 10px;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  background: #f8f9fa;
  font-size: 16px;
  color: #333;
  transition: all 0.3s ease;
  cursor: pointer;
  box-sizing: border-box;

  & option {
    padding: 10px;
    font-size: 14px;
  }

  &:focus {
    outline: none;
    background: #fff;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.1);
  }
`;

const CountryOption = styled.option`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PhoneInput = styled(Input)`
  flex: 1;
  margin: 0;
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

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+40', // Default to Romania
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const countries = [
    { code: 'AL', name: 'Albania', dialCode: '+355' },
    { code: 'AD', name: 'Andorra', dialCode: '+376' },
    { code: 'AT', name: 'Austria', dialCode: '+43' },
    { code: 'BY', name: 'Belarus', dialCode: '+375' },
    { code: 'BE', name: 'Belgium', dialCode: '+32' },
    { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387' },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359' },
    { code: 'HR', name: 'Croatia', dialCode: '+385' },
    { code: 'CY', name: 'Cyprus', dialCode: '+357' },
    { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
    { code: 'DK', name: 'Denmark', dialCode: '+45' },
    { code: 'EE', name: 'Estonia', dialCode: '+372' },
    { code: 'FI', name: 'Finland', dialCode: '+358' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'GR', name: 'Greece', dialCode: '+30' },
    { code: 'HU', name: 'Hungary', dialCode: '+36' },
    { code: 'IS', name: 'Iceland', dialCode: '+354' },
    { code: 'IE', name: 'Ireland', dialCode: '+353' },
    { code: 'IT', name: 'Italy', dialCode: '+39' },
    { code: 'LV', name: 'Latvia', dialCode: '+371' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423' },
    { code: 'LT', name: 'Lithuania', dialCode: '+370' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
    { code: 'MT', name: 'Malta', dialCode: '+356' },
    { code: 'MD', name: 'Moldova', dialCode: '+373' },
    { code: 'MC', name: 'Monaco', dialCode: '+377' },
    { code: 'ME', name: 'Montenegro', dialCode: '+382' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31' },
    { code: 'MK', name: 'North Macedonia', dialCode: '+389' },
    { code: 'NO', name: 'Norway', dialCode: '+47' },
    { code: 'PL', name: 'Poland', dialCode: '+48' },
    { code: 'PT', name: 'Portugal', dialCode: '+351' },
    { code: 'RO', name: 'Romania', dialCode: '+40' },
    { code: 'RU', name: 'Russia', dialCode: '+7' },
    { code: 'SM', name: 'San Marino', dialCode: '+378' },
    { code: 'RS', name: 'Serbia', dialCode: '+381' },
    { code: 'SK', name: 'Slovakia', dialCode: '+421' },
    { code: 'SI', name: 'Slovenia', dialCode: '+386' },
    { code: 'ES', name: 'Spain', dialCode: '+34' },
    { code: 'SE', name: 'Sweden', dialCode: '+46' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
    { code: 'VA', name: 'Vatican City', dialCode: '+379' }
  ];

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: `${formData.countryCode}${formData.phone}`,
          },
          emailRedirectTo: `${window.location.origin}/zabot/`,
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        navigate('/', { 
          state: { 
            message: 'Please check your email for the confirmation link' 
          } 
        });
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpContainer>
      <SignUpCard>
        <LeftSection>
          <WelcomeTitle>Welcome!</WelcomeTitle>
          <WelcomeText>
            Join our community and start your journey with us. Create your account now!
          </WelcomeText>
        </LeftSection>
        <RightSection>
          <Title>SIGN UP</Title>
          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <PhoneInputGroup>
              <CountrySelect
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
              >
                {countries.map((country) => (
                  <CountryOption key={country.code} value={country.dialCode}>
                    {country.code} {country.dialCode}
                  </CountryOption>
                ))}
              </CountrySelect>
              <PhoneInput
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </PhoneInputGroup>
            <InputWrapper>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
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
                placeholder="Confirm Password"
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
              {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
            </Button>
          </form>
          <LoginLink to="/">Already have an account? Login</LoginLink>
        </RightSection>
      </SignUpCard>
    </SignUpContainer>
  );
};

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

export default SignUp; 