// ============================================================
// App.js - Root Component with Routing
// ============================================================

import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';
import './styles/main.css';

// Auth Pages
import Login    from './components/Auth/Login';
import Register from './components/Auth/Register';

// Layout
import AppLayout from './components/Common/AppLayout';

// Dashboard (role-aware)
import Dashboard from './components/Dashboard/Dashboard';

// Employee
import MyProfile      from './components/Employee/MyProfile';
import SelfAppraisal  from './components/Employee/SelfAppraisal';
import MyAppraisals   from './components/Employee/MyAppraisals';

// Manager
import TeamMembers        from './components/Manager/TeamMembers';
import TeamAppraisals     from './components/Manager/TeamAppraisals';
import EvaluateAppraisal  from './components/Manager/EvaluateAppraisal';

// Admin
import ManageUsers    from './components/Admin/ManageUsers';
import AllAppraisals  from './components/Admin/AllAppraisals';
import Reports        from './components/Admin/Reports';

// Loading screen
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner" />
    <p>Loading…</p>
  </div>
);

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected Routes — wrapped in AppLayout (sidebar + header) */}
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />

      {/* All roles */}
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="profile"   element={<MyProfile />} />

      {/* Employee */}
      <Route path="self-appraisal"  element={<ProtectedRoute roles={['employee']}><SelfAppraisal /></ProtectedRoute>} />
      <Route path="my-appraisals"   element={<ProtectedRoute roles={['employee']}><MyAppraisals /></ProtectedRoute>} />

      {/* Manager */}
      <Route path="team"              element={<ProtectedRoute roles={['manager','admin']}><TeamMembers /></ProtectedRoute>} />
      <Route path="team-appraisals"   element={<ProtectedRoute roles={['manager']}><TeamAppraisals /></ProtectedRoute>} />
      <Route path="evaluate/:id"      element={<ProtectedRoute roles={['manager']}><EvaluateAppraisal /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="manage-users"   element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
      <Route path="all-appraisals" element={<ProtectedRoute roles={['admin']}><AllAppraisals /></ProtectedRoute>} />
      <Route path="reports"        element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
