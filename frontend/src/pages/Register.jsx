import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [step, setStep]         = useState('form'); // 'form' or 'otp'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  const submitForm = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { email, password });
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.description || 'Registration failed');
    }
  };

  const submitOtp = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/verify', { otp });
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.description || 'Invalid OTP');
    }
  };

  return step === 'form' ? (
    <div style={{ padding: '1rem' }}>
      <h2>Register</h2>
      <form onSubmit={submitForm}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Email:&nbsp;
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Password:&nbsp;
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Request OTP</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  ) : (
    <div style={{ padding: '1rem' }}>
      <h2>Enter OTP</h2>
      <form onSubmit={submitOtp}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            OTP:&nbsp;
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Verify</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}
