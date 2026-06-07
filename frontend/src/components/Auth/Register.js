// components/Auth/Register.js

import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'employee', department: '', designation: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password) return 'All required fields must be filled.';
    if (form.password !== form.confirmPassword)       return 'Passwords do not match.';
    if (form.password.length < 6)                     return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name:        form.name,
        email:       form.email,
        password:    form.password,
        role:        form.role,
        department:  form.department,
        designation: form.designation
      });
      // Auto-login after registration
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div>
          <div className="auth-logo">
            Join the<br /><span>Team</span>
          </div>
          <p className="auth-tagline">
            Create your account and start managing performance appraisals
            with clarity and confidence.
          </p>
        </div>
      </div>

      <div className="auth-right" style={{ overflowY: 'auto', padding: '32px 44px' }}>
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="subtitle">Fill in the details below to register</p>

          {error && (
            <div style={{
              background: '#fde8e8', color: '#c81e1e',
              padding: '10px 14px', borderRadius: 8,
              fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input type="text" name="name" className="form-control"
                placeholder="John Smith" value={form.name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input type="email" name="email" className="form-control"
                placeholder="john@company.com" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <input type="password" name="password" className="form-control"
                  placeholder="Min 6 chars" value={form.password} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <input type="password" name="confirmPassword" className="form-control"
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" name="department" className="form-control"
                  placeholder="Engineering" value={form.department} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Designation</label>
              <input type="text" name="designation" className="form-control"
                placeholder="Software Engineer" value={form.designation} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, marginTop: 20 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
