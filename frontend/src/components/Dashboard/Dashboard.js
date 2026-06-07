// components/Dashboard/Dashboard.js

import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

// ── Shared: Score Bar ────────────────────────────────────────
const ScoreBar = ({ score, max = 5 }) => (
  <div className="score-bar-wrap">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span className="score-number">{score}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {max}</span>
    </div>
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${(score / max) * 100}%` }} />
    </div>
  </div>
);

// ── Grade Badge ──────────────────────────────────────────────
const GradeBadge = ({ grade }) => (
  <span className={`grade-badge grade-${grade}`}>{grade}</span>
);

// ── Status Badge ─────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    draft:        'badge-muted',
    submitted:    'badge-primary',
    under_review: 'badge-warning',
    approved:     'badge-success',
    rejected:     'badge-danger'
  };
  return (
    <span className={`badge ${map[status] || 'badge-muted'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ── Admin Dashboard ──────────────────────────────────────────
const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/summary')
      .then(r => setSummary(r.data.summary))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="stats-grid">
        {[
          { label: 'Total Employees', value: summary?.totalEmployees ?? 0, icon: '👥', cls: 'stat-blue' },
          { label: 'Total Managers',  value: summary?.totalManagers  ?? 0, icon: '🧑‍💼', cls: 'stat-green' },
          { label: 'Total Appraisals',value: summary?.totalAppraisals?? 0, icon: '📋', cls: 'stat-orange' },
          { label: 'Avg Score',       value: summary?.avgScore        ?? 0, icon: '⭐', cls: 'stat-yellow' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Grade Distribution */}
        <div className="card">
          <div className="card-header"><h3>Grade Distribution</h3></div>
          <div className="card-body">
            {summary?.gradeDistribution?.length === 0 && (
              <div className="empty-state"><p>No approved appraisals yet.</p></div>
            )}
            {(summary?.gradeDistribution || []).map(g => (
              <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <GradeBadge grade={g._id} />
                <div style={{ flex: 1 }}>
                  <div className="score-bar-track">
                    <div className="score-bar-fill"
                      style={{ width: `${(g.count / (summary.approvedAppraisals || 1)) * 100}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 30 }}>{g.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Scores */}
        <div className="card">
          <div className="card-header"><h3>Department Performance</h3></div>
          <div className="card-body">
            {summary?.deptScores?.length === 0 && (
              <div className="empty-state"><p>No data yet.</p></div>
            )}
            {(summary?.deptScores || []).map(d => (
              <div key={d._id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d._id || 'General'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.count} employees</span>
                </div>
                <ScoreBar score={d.avgScore} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>Quick Actions</h3></div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/manage-users"   className="btn btn-primary">👥 Manage Users</Link>
          <Link to="/all-appraisals" className="btn btn-outline">📋 View Appraisals</Link>
          <Link to="/reports"        className="btn btn-outline">📊 View Reports</Link>
        </div>
      </div>
    </div>
  );
};

// ── Manager Dashboard ────────────────────────────────────────
const ManagerDashboard = () => {
  const [data, setData]     = useState({ team: [], appraisals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/users/team'),
      axios.get('/api/appraisals/team')
    ]).then(([teamRes, apprRes]) => {
      setData({ team: teamRes.data.employees, appraisals: apprRes.data.appraisals });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  const pending  = data.appraisals.filter(a => a.status === 'submitted').length;
  const approved = data.appraisals.filter(a => a.status === 'approved').length;

  return (
    <div>
      <div className="stats-grid">
        {[
          { label: 'Team Size',         value: data.team.length, icon: '👥', cls: 'stat-blue' },
          { label: 'Pending Reviews',   value: pending,          icon: '⏳', cls: 'stat-yellow' },
          { label: 'Approved',          value: approved,         icon: '✅', cls: 'stat-green' },
          { label: 'Total Appraisals',  value: data.appraisals.length, icon: '📋', cls: 'stat-orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending appraisals */}
      <div className="card">
        <div className="card-header">
          <h3>Pending Reviews</h3>
          <Link to="/team-appraisals" className="btn btn-sm btn-outline">View All</Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {data.appraisals.filter(a => a.status === 'submitted').length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎉</div><p>No pending reviews!</p></div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th><th>Period</th><th>Self Score</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appraisals.filter(a => a.status === 'submitted').slice(0, 5).map(a => (
                    <tr key={a._id}>
                      <td><strong>{a.employeeId?.name}</strong></td>
                      <td>{a.period}</td>
                      <td><ScoreBar score={a.selfScore} /></td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <Link to={`/evaluate/${a._id}`} className="btn btn-sm btn-primary">Evaluate</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Employee Dashboard ───────────────────────────────────────
const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appraisals, setAppraisals] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    axios.get('/api/appraisals/my')
      .then(r => setAppraisals(r.data.appraisals || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  const latest   = appraisals[0];
  const approved = appraisals.filter(a => a.status === 'approved');

  return (
    <div>
      <div className="stats-grid">
        {[
          { label: 'Total Submitted',   value: appraisals.length,  icon: '📋', cls: 'stat-blue' },
          { label: 'Approved',          value: approved.length,     icon: '✅', cls: 'stat-green' },
          { label: 'Latest Score',      value: latest?.finalScore || '—', icon: '⭐', cls: 'stat-yellow' },
          { label: 'Latest Grade',      value: latest?.grade       || '—', icon: '🏅', cls: 'stat-orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent appraisals */}
        <div className="card">
          <div className="card-header">
            <h3>Appraisal History</h3>
            <Link to="/my-appraisals" className="btn btn-sm btn-outline">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {appraisals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>No appraisals yet. Submit your first one!</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr><th>Period</th><th>Self Score</th><th>Final Score</th><th>Grade</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {appraisals.slice(0, 5).map(a => (
                      <tr key={a._id}>
                        <td>{a.period} {a.year}</td>
                        <td>{a.selfScore || '—'}</td>
                        <td>{a.finalScore || '—'}</td>
                        <td>{a.grade !== 'N/A' ? <GradeBadge grade={a.grade} /> : '—'}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/self-appraisal" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              ✍️ &nbsp; Submit Self-Appraisal
            </Link>
            <Link to="/my-appraisals"  className="btn btn-outline"  style={{ justifyContent: 'flex-start' }}>
              📄 &nbsp; View My Appraisals
            </Link>
            <Link to="/profile"        className="btn btn-outline"  style={{ justifyContent: 'flex-start' }}>
              👤 &nbsp; Update Profile
            </Link>
          </div>

          {/* Manager info */}
          {user?.managerId && (
            <div style={{ padding: '0 16px 16px', marginTop: 4 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>YOUR MANAGER</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.managerId.name || 'Assigned'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard (role switcher) ───────────────────────────
const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      {user?.role === 'admin'    && <AdminDashboard />}
      {user?.role === 'manager'  && <ManagerDashboard />}
      {user?.role === 'employee' && <EmployeeDashboard />}
    </div>
  );
};

export default Dashboard;
