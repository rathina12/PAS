// components/Manager/TeamAppraisals.js
// OOAD Pattern: Observer - manager observes team appraisal state changes

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { StatusBadge } from '../Dashboard/Dashboard';

const TeamAppraisals = () => {
  const [searchParams]                      = useSearchParams();
  const [appraisals,    setAppraisals]      = useState([]);
  const [filterStatus,  setFilterStatus]    = useState('');
  const [loading,       setLoading]         = useState(true);

  // useCallback keeps fetchTeamAppraisals stable so useEffect dep array is safe
  const fetchTeamAppraisals = useCallback(() => {
    setLoading(true);
    const params = filterStatus ? `?status=${filterStatus}` : '';
    axios.get(`/api/appraisals/team${params}`)
      .then(r => setAppraisals(r.data.appraisals || []))
      .catch(() => setAppraisals([]))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => {
    fetchTeamAppraisals();
  }, [fetchTeamAppraisals]);

  // Optionally filter by employee query param (from TeamMembers card link)
  const employeeFilter = searchParams.get('employee');
  const displayed = employeeFilter
    ? appraisals.filter(a => a.employeeId?._id === employeeFilter)
    : appraisals;

  const counts = {
    all:          appraisals.length,
    submitted:    appraisals.filter(a => a.status === 'submitted').length,
    under_review: appraisals.filter(a => a.status === 'under_review').length,
    approved:     appraisals.filter(a => a.status === 'approved').length,
    rejected:     appraisals.filter(a => a.status === 'rejected').length,
  };

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Team Appraisals</h2>
          <p>Review and evaluate your team's performance appraisals</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { val: '',             label: `All (${counts.all})` },
          { val: 'submitted',    label: `Pending (${counts.submitted})` },
          { val: 'under_review', label: `In Review (${counts.under_review})` },
          { val: 'approved',     label: `Approved (${counts.approved})` },
          { val: 'rejected',     label: `Rejected (${counts.rejected})` },
        ].map(f => (
          <button
            key={f.val}
            className={`tab-btn ${filterStatus === f.val ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.val)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No appraisals found for this filter.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Period</th>
                <th>Self Score</th>
                <th>Final Score</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(a => (
                <tr key={a._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.employeeId?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {a.employeeId?.email || ''}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{a.employeeId?.department || '—'}</td>
                  <td>
                    <strong>{a.period}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{a.year}</span>
                  </td>
                  <td>{a.selfScore    ? a.selfScore.toFixed(2)    : '—'}</td>
                  <td style={{ fontWeight: 700 }}>
                    {a.finalScore ? a.finalScore.toFixed(2) : '—'}
                  </td>
                  <td>
                    {a.grade && a.grade !== 'N/A'
                      ? <span className={`grade-badge grade-${a.grade}`}>{a.grade}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {a.submittedAt
                      ? new Date(a.submittedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    {(a.status === 'submitted' || a.status === 'under_review') ? (
                      <Link to={`/evaluate/${a._id}`} className="btn btn-sm btn-primary">
                        Evaluate
                      </Link>
                    ) : (
                      <Link to={`/evaluate/${a._id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamAppraisals;
