// components/Admin/AllAppraisals.js
// OOAD Pattern: Facade - abstracts filtering/searching complexity

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { StatusBadge } from '../Dashboard/Dashboard';

const AllAppraisals = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('');
  const [search,     setSearch]     = useState('');

  // useCallback so fetchAppraisals is a stable reference safe for useEffect deps
  const fetchAppraisals = useCallback(() => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    axios.get(`/api/appraisals/all${params}`)
      .then(r => setAppraisals(r.data.appraisals || []))
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchAppraisals();
  }, [fetchAppraisals]);

  const counts = {
    all:          appraisals.length,
    submitted:    appraisals.filter(a => a.status === 'submitted').length,
    under_review: appraisals.filter(a => a.status === 'under_review').length,
    approved:     appraisals.filter(a => a.status === 'approved').length,
    rejected:     appraisals.filter(a => a.status === 'rejected').length,
  };

  const displayed = search
    ? appraisals.filter(a =>
        a.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.period?.toLowerCase().includes(search.toLowerCase())
      )
    : appraisals;

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>All Appraisals</h2>
          <p>{appraisals.length} total appraisals in the system</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          {[
            { val: '',             label: `All (${counts.all})` },
            { val: 'submitted',    label: `Pending (${counts.submitted})` },
            { val: 'under_review', label: `In Review (${counts.under_review})` },
            { val: 'approved',     label: `Approved (${counts.approved})` },
            { val: 'rejected',     label: `Rejected (${counts.rejected})` },
          ].map(f => (
            <button
              key={f.val}
              className={`tab-btn ${filter === f.val ? 'active' : ''}`}
              onClick={() => setFilter(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="form-control"
          style={{ width: 240, marginBottom: 0 }}
          placeholder="🔍 Search name or period…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Employee</th><th>Manager</th><th>Period</th>
              <th>Self Score</th><th>Manager Score</th><th>Final Score</th>
              <th>Grade</th><th>Status</th><th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((a, i) => (
              <tr key={a._id}>
                <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{a.employeeId?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.employeeId?.department || ''}</div>
                </td>
                <td style={{ fontSize: 13 }}>{a.managerId?.name || '—'}</td>
                <td>
                  <strong>{a.period}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{a.year}</span>
                </td>
                <td>{a.selfScore     ? a.selfScore.toFixed(2)     : '—'}</td>
                <td>{a.managerScore  ? a.managerScore.toFixed(2)  : '—'}</td>
                <td style={{ fontWeight: 700, fontSize: 15 }}>
                  {a.finalScore ? a.finalScore.toFixed(2) : '—'}
                </td>
                <td>
                  {a.grade && a.grade !== 'N/A'
                    ? <span className={`grade-badge grade-${a.grade}`}>{a.grade}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td><StatusBadge status={a.status} /></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No appraisals found for this filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllAppraisals;
