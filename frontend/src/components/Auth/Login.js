// components/Auth/Login.js

import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div>
          <div className="auth-logo">
            Performance<br /><span>Appraisal</span><br />System
          </div>
          <p className="auth-tagline">
            A comprehensive platform to manage employee evaluations,
            track performance growth, and drive organizational excellence.
          </p>
          <div className="auth-features">
            {[
              ['📊', 'Data-driven performance insights'],
              ['🎯', 'Goal tracking & feedback cycles'],
              ['🏆', 'Recognition & reward management'],
              ['📈', 'Real-time analytics & reports'],
            ].map(([icon, text]) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome back 👋</h2>
          <p className="subtitle">Sign in to your account to continue</p>

          {error && (
            <div style={{
              background: '#fde8e8', color: '#c81e1e',
              padding: '10px 14px', borderRadius: 8,
              fontSize: 14, marginBottom: 16,
              border: '1px solid #f8b4b4'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>New here?</span></div>

          <p style={{ textAlign: 'center', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
            <span style={{ color: '#94a3b8', margin: '0 6px' }}>·</span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>or contact your admin</span>
          </p>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 24, padding: '12px 14px',
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 8, fontSize: 12, color: '#0369a1'
          }}>
            <strong>Demo:</strong> Register an account with role "admin" to get started.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
