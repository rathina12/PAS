// ============================================================
// components/Common/AppLayout.js
// ============================================================
// This is the main shell containing the Sidebar, TopHeader,
// and the <Outlet /> where page content renders.

import React, { useState, useContext, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

// ── Navigation config per role ───────────────────────────────
const NAV = {
  admin: [
    { section: 'Overview',    items: [{ to: '/dashboard',    icon: '🏠', label: 'Dashboard' }] },
    { section: 'Management',  items: [
      { to: '/manage-users',   icon: '👥', label: 'Manage Users' },
      { to: '/all-appraisals', icon: '📋', label: 'All Appraisals' },
      { to: '/team',           icon: '🏢', label: 'View Teams' },
      { to: '/reports',        icon: '📊', label: 'Reports' }
    ]},
    { section: 'Account',     items: [{ to: '/profile', icon: '👤', label: 'My Profile' }] }
  ],
  manager: [
    { section: 'Overview',  items: [{ to: '/dashboard',      icon: '🏠', label: 'Dashboard' }] },
    { section: 'My Team',   items: [
      { to: '/team',           icon: '👥', label: 'Team Members' },
      { to: '/team-appraisals',icon: '📋', label: 'Team Appraisals' }
    ]},
    { section: 'Account',   items: [{ to: '/profile', icon: '👤', label: 'My Profile' }] }
  ],
  employee: [
    { section: 'Overview',    items: [{ to: '/dashboard',       icon: '🏠', label: 'Dashboard' }] },
    { section: 'Appraisals',  items: [
      { to: '/self-appraisal', icon: '✍️',  label: 'Submit Appraisal' },
      { to: '/my-appraisals',  icon: '📄', label: 'My Appraisals' }
    ]},
    { section: 'Account',     items: [{ to: '/profile', icon: '👤', label: 'My Profile' }] }
  ]
};

// ── Notification Panel ───────────────────────────────────────
const NotifPanel = ({ onClose }) => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/notifications')
      .then(r => setNotifs(r.data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await axios.put(`/api/users/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span>Notifications</span>
        <button onClick={onClose} className="modal-close">×</button>
      </div>
      <div className="notif-list">
        {loading && <div className="notif-empty">Loading…</div>}
        {!loading && notifs.length === 0 && (
          <div className="notif-empty">🔔 No notifications yet</div>
        )}
        {notifs.map(n => (
          <div
            key={n._id}
            className={`notif-item ${!n.isRead ? 'unread' : ''}`}
            onClick={() => markRead(n._id)}
          >
            <div className="notif-title">{n.title}</div>
            <div className="notif-message">{n.message}</div>
            <div className="notif-time">{timeAgo(n.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Layout ──────────────────────────────────────────────
const AppLayout = () => {
  const { user, logout }   = useContext(AuthContext);
  const navigate           = useNavigate();
  const location           = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  // Fetch unread notification count
  useEffect(() => {
    axios.get('/api/users/notifications')
      .then(r => setUnreadCount((r.data.notifications || []).filter(n => !n.isRead).length))
      .catch(() => {});
  }, [location.pathname]);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navSections = NAV[user?.role] || [];
  const initials    = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Get current page title from nav
  const allItems    = navSections.flatMap(s => s.items);
  const currentItem = allItems.find(item => location.pathname === item.to);
  const pageTitle   = currentItem?.label || 'Performance Appraisal';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        {/* ── Sidebar ── */}
        {mobileNavOpen && <button className="mobile-sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
        <aside id="pas-navigation" className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <h2>PAS Pro</h2>
            <span>Performance Appraisal</span>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <p>{user?.name}</p>
              <span>{user?.role}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navSections.map(section => (
              <div key={section.section}>
                <div className="nav-section-label">{section.section}</div>
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="main-content">
          {/* Top Header */}
          <header className="top-header">
            <button className="mobile-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={mobileNavOpen} aria-controls="pas-navigation" onClick={() => setMobileNavOpen(v => !v)}>☰</button>
            <div className="header-left">
              <h1>{pageTitle}</h1>
              <p>Welcome, {user?.name} · {user?.department}</p>
            </div>
            <div className="header-right">
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  className="notif-btn"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={showNotif}
                  onClick={() => setShowNotif(prev => !prev)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="page-body">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
