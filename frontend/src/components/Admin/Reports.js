// components/Admin/Reports.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const GRADE_COLORS = { A: '#0e9f6e', B: '#1a56db', C: '#e3a008', D: '#ff5a1f', F: '#e02424', 'N/A': '#94a3b8' };

const Reports = () => {
  const [summary, setSummary]   = useState(null);
  const [report,  setReport]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab,     setTab]       = useState('overview');

  useEffect(() => {
    Promise.all([
      axios.get('/api/reports/summary'),
      axios.get('/api/reports/performance')
    ]).then(([sRes, rRes]) => {
      setSummary(sRes.data.summary);
      setReport(rRes.data.report || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  const deptChartData = (summary?.deptScores || []).map(d => ({
    name:  d._id || 'General',
    score: d.avgScore,
    count: d.count
  }));

  const gradeData = (summary?.gradeDistribution || []).map(g => ({
    name:  `Grade ${g._id}`,
    value: g.count,
    color: GRADE_COLORS[g._id] || '#94a3b8'
  }));

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Performance Reports</h2>
          <p>System-wide analytics and insights</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Report</button>
      </div>

      {/* Summary KPIs */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: summary?.totalEmployees, icon: '👥', cls: 'stat-blue' },
          { label: 'Total Managers',  value: summary?.totalManagers,  icon: '🧑‍💼', cls: 'stat-green' },
          { label: 'Approved Appraisals', value: summary?.approvedAppraisals, icon: '✅', cls: 'stat-green' },
          { label: 'Pending Reviews', value: summary?.pendingAppraisals, icon: '⏳', cls: 'stat-yellow' },
          { label: 'Avg System Score', value: summary?.avgScore, icon: '⭐', cls: 'stat-orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value ?? 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {['overview', 'departments', 'employees'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Grade distribution pie */}
          <div className="card">
            <div className="card-header"><h3>Grade Distribution</h3></div>
            <div className="card-body">
              {gradeData.length === 0
                ? <div className="empty-state"><p>No approved appraisals yet.</p></div>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={gradeData} cx="50%" cy="50%" outerRadius={90}
                        dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {gradeData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          {/* Department scores bar */}
          <div className="card">
            <div className="card-header"><h3>Avg Score by Department</h3></div>
            <div className="card-body">
              {deptChartData.length === 0
                ? <div className="empty-state"><p>No department data yet.</p></div>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#1a56db" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>
        </div>
      )}

      {tab === 'departments' && (
        <div className="card">
          <div className="card-header"><h3>Department Performance Breakdown</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr><th>Department</th><th>Employee Count</th><th>Avg Score</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  {(summary?.deptScores || []).map(d => (
                    <tr key={d._id}>
                      <td><strong>{d._id || 'General'}</strong></td>
                      <td>{d.count}</td>
                      <td style={{ fontWeight: 700 }}>{d.avgScore}</td>
                      <td style={{ minWidth: 180 }}>
                        <div className="score-bar-track" style={{ height: 8 }}>
                          <div className="score-bar-fill" style={{ width: `${(d.avgScore/5)*100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(summary?.deptScores || []).length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No data available.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="card">
          <div className="card-header">
            <h3>Employee Performance Ranking</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sorted by final score (approved only)</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th><th>Employee</th><th>Department</th>
                    <th>Period</th><th>Self Score</th><th>Manager Score</th>
                    <th>Final Score</th><th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((a, i) => (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.employeeId?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.employeeId?.designation}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{a.employeeId?.department}</td>
                      <td>{a.period} {a.year}</td>
                      <td>{a.selfScore}</td>
                      <td>{a.managerScore}</td>
                      <td style={{ fontWeight: 700, fontSize: 16 }}>{a.finalScore}</td>
                      <td>
                        <span className={`grade-badge grade-${a.grade}`}>{a.grade}</span>
                      </td>
                    </tr>
                  ))}
                  {report.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No approved appraisals to display.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
