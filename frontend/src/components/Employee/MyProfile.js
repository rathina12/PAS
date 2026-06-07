// components/Employee/MyProfile.js

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MyProfile = () => {
  const { user, setUser } = useContext(AuthContext);
  const { addToast }      = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:        user?.name        || '',
    department:  user?.department  || '',
    designation: user?.designation || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`/api/users/${user._id}`, form);
      setUser(res.data.user);
      setEditing(false);
      addToast('Profile Updated', 'Your profile has been updated.', 'success');
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to update.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="section-header">
        <div>
          <h2>My Profile</h2>
          <p>View and update your personal information</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ Edit</button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Avatar & name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700
            }}>
              {initials}
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700 }}>{user?.name}</h3>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span className={`badge ${
                  user?.role === 'admin' ? 'badge-danger' :
                  user?.role === 'manager' ? 'badge-warning' : 'badge-primary'
                }`}>
                  {user?.role}
                </span>
                <span className="badge badge-muted">{user?.department}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 24 }} />

          {/* Fields */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {editing
                ? <input className="form-control" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                : <div style={{ padding: '10px 0', fontSize: 15 }}>{user?.name}</div>
              }
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ padding: '10px 0', fontSize: 15, color: 'var(--text-secondary)' }}>
                {user?.email}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>(cannot change)</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              {editing
                ? <input className="form-control" value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                : <div style={{ padding: '10px 0', fontSize: 15 }}>{user?.department || '—'}</div>
              }
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              {editing
                ? <input className="form-control" value={form.designation}
                    onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
                : <div style={{ padding: '10px 0', fontSize: 15 }}>{user?.designation || '—'}</div>
              }
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ padding: '10px 0', fontSize: 15, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <div style={{ padding: '10px 0', fontSize: 15 }}>
                {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving…' : '✓ Save Changes'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
