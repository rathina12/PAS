// components/Admin/ManageUsers.js
// OOAD Pattern: Command - each button (Create/Edit/Deactivate) encapsulates an action

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'employee',
  department: '', designation: '', managerId: ''
};

const ManageUsers = () => {
  const { addToast }              = useToast();
  const [users,     setUsers]     = useState([]);
  const [managers,  setManagers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [roleFilter, setRoleFilter] = useState('all');
  const [search,    setSearch]    = useState('');

  // Stable fetch function — useCallback prevents infinite re-render loop
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, mgrsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/users/managers')
      ]);
      setUsers(usersRes.data.users     || []);
      setManagers(mgrsRes.data.managers || []);
    } catch (err) {
      addToast('Error', 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Modal helpers ──────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name:        user.name        || '',
      email:       user.email       || '',
      password:    '',
      role:        user.role        || 'employee',
      department:  user.department  || '',
      designation: user.designation || '',
      managerId:   user.managerId?._id || user.managerId || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!editUser && !form.password) errs.password = 'Password is required for new users';
    if (!editUser && form.password && form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save (create or update) ────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        email:       form.email.trim(),
        role:        form.role,
        department:  form.department.trim(),
        designation: form.designation.trim(),
        managerId:   form.managerId || null
      };
      // Only include password if it was entered
      if (form.password) payload.password = form.password;

      if (editUser) {
        await axios.put(`/api/users/${editUser._id}`, payload);
        addToast('User Updated', `${form.name} has been updated successfully.`, 'success');
      } else {
        await axios.post('/api/users', payload);
        addToast('User Created', `${form.name} has been added to the system.`, 'success');
      }
      closeModal();
      fetchData();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to save user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active/inactive ─────────────────────────────────
  const handleToggleActive = async (user) => {
    try {
      await axios.put(`/api/users/${user._id}`, { isActive: !user.isActive });
      addToast(
        'Status Updated',
        `${user.name} has been ${user.isActive ? 'deactivated' : 'activated'}.`,
        'info'
      );
      fetchData();
    } catch {
      addToast('Error', 'Failed to update user status.', 'error');
    }
  };

  // ── Filtering ──────────────────────────────────────────────
  const displayed = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    all:      users.length,
    admin:    users.filter(u => u.role === 'admin').length,
    manager:  users.filter(u => u.role === 'manager').length,
    employee: users.filter(u => u.role === 'employee').length,
  };

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="section-header">
        <div>
          <h2>Manage Users</h2>
          <p>{users.length} total users · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add User
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          {[
            { val: 'all',      label: `All (${counts.all})` },
            { val: 'admin',    label: `Admins (${counts.admin})` },
            { val: 'manager',  label: `Managers (${counts.manager})` },
            { val: 'employee', label: `Employees (${counts.employee})` },
          ].map(f => (
            <button
              key={f.val}
              className={`tab-btn ${roleFilter === f.val ? 'active' : ''}`}
              onClick={() => setRoleFilter(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="form-control"
          style={{ width: 240, marginBottom: 0 }}
          placeholder="🔍 Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Users Table ── */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(u => (
              <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'admin'   ? 'badge-danger'  :
                    u.role === 'manager' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{u.department  || '—'}</td>
                <td style={{ fontSize: 13 }}>{u.designation || '—'}</td>
                <td style={{ fontSize: 13 }}>{u.managerId?.name || '—'}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-muted'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No users match your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? '✏️ Edit User' : '➕ Add New User'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Name + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder="John Smith"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>
              </div>

              {/* Password + Role */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Password{' '}
                    {editUser
                      ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(leave blank to keep)</span>
                      : <span className="required">*</span>
                    }
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder={editUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value, managerId: '' }))}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Department + Designation */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Engineering"
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Software Engineer"
                    value={form.designation}
                    onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                  />
                </div>
              </div>

              {/* Manager assignment — only for employees */}
              {form.role === 'employee' && (
                <div className="form-group">
                  <label className="form-label">Assign Manager</label>
                  <select
                    className="form-control"
                    value={form.managerId}
                    onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                  >
                    <option value="">— No Manager Assigned —</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name}  {m.department ? `(${m.department})` : ''}
                      </option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <div className="form-error">
                      No managers found. Create a manager account first.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? 'Saving…'
                  : editUser ? '✓ Update User' : '✓ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
