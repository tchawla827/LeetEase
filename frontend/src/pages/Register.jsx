// frontend/src/pages/Register.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [step, setStep]           = useState('form'); // 'form' or 'otp'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [college, setCollege]     = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const navigate                  = useNavigate();

  const submitForm = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', {
        firstName,
        lastName,
        college: college || undefined, // omit if empty
        email,
        password
      });
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

  if (step === 'form') {
    return (
      <div style={{ padding: '1rem', maxWidth: 400, margin: '0 auto' }}>
        <h2>Register</h2>
        <form onSubmit={submitForm}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label>
              First Name:&nbsp;
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label>
              Last Name:&nbsp;
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label>
              College (optional):&nbsp;
              <input
                type="text"
                value={college}
                onChange={e => setCollege(e.target.value)}
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
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
          <div style={{ marginBottom: '1rem' }}>
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
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Request OTP
          </button>
          {error && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
          )}
        </form>
        <p style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    );
  }

  // OTP step
  return (
    <div style={{ padding: '1rem', maxWidth: 400, margin: '0 auto' }}>
      <h2>Enter OTP</h2>
      <form onSubmit={submitOtp}>
        <div style={{ marginBottom: '1rem' }}>
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
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Verify
        </button>
        {error && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
        )}
      </form>
    </div>
  );
}
