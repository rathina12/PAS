// components/Employee/MyAppraisals.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { StatusBadge } from '../Dashboard/Dashboard';

const CRITERIA_LABELS = {
  communication:   'Communication',
  technicalSkills: 'Technical Skills',
  teamwork:        'Teamwork',
  punctuality:     'Punctuality',
  leadership:      'Leadership',
  problemSolving:  'Problem Solving'
};

const ScoreBar = ({ score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div className="score-bar-track" style={{ flex: 1, height: 6 }}>
      <div className="score-bar-fill" style={{ width: `${(score / 5) * 100}%` }} />
    </div>
    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 30 }}>{score}/5</span>
  </div>
);

const GradeBadge = ({ grade }) => (
  <span className={`grade-badge grade-${grade}`} style={{ width: 40, height: 40, fontSize: 18 }}>{grade}</span>
);

const AppraisalDetail = ({ appraisal, onClose }) => {
  const cr = appraisal.selfRatings    || {};
  const mr = appraisal.managerRatings || {};
  const sc = appraisal.selfComments   || {};
  const mc = appraisal.managerComments|| {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Appraisal Detail — {appraisal.period} {appraisal.year}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Summary row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24
          }}>
            {[
              { label: 'Self Score',    value: appraisal.selfScore    || '—' },
              { label: 'Manager Score', value: appraisal.managerScore || '—' },
              { label: 'Final Score',   value: appraisal.finalScore   || '—' },
              { label: 'Status',        value: <StatusBadge status={appraisal.status} /> },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Criteria table */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Performance Criteria Breakdown</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Criteria</th>
                  <th>Self Rating</th>
                  <th>Self Comment</th>
                  <th>Manager Rating</th>
                  <th>Manager Comment</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(CRITERIA_LABELS).map(key => (
                  <tr key={key}>
                    <td><strong>{CRITERIA_LABELS[key]}</strong></td>
                    <td style={{ minWidth: 140 }}>
                      {cr[key] ? <ScoreBar score={cr[key]} /> : '—'}
                    </td>
                    <td style={{ maxWidth: 180, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {sc[key] || '—'}
                    </td>
                    <td style={{ minWidth: 140 }}>
                      {mr[key] ? <ScoreBar score={mr[key]} /> : <span style={{ color: 'var(--text-muted)' }}>Pending</span>}
                    </td>
                    <td style={{ maxWidth: 180, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {mc[key] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manager feedback */}
          {appraisal.status === 'approved' && (
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: '💪 Strengths',    val: mc.strengths    },
                { label: '📈 Areas to Improve', val: mc.improvements },
                { label: '💬 Overall Feedback', val: mc.overall },
                { label: '📝 Your Overall Comment', val: sc.overall }
              ].map(item => item.val && (
                <div key={item.label} style={{
                  background: 'var(--bg)', borderRadius: 10, padding: 16
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{item.label}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.val}</p>
                </div>
              ))}
            </div>
          )}

          {appraisal.grade && appraisal.grade !== 'N/A' && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>FINAL GRADE</div>
              <GradeBadge grade={appraisal.grade} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MyAppraisals = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    axios.get('/api/appraisals/my')
      .then(r => setAppraisals(r.data.appraisals || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>My Appraisals</h2>
          <p>View all your submitted self-appraisals and manager feedback</p>
        </div>
        <Link to="/self-appraisal" className="btn btn-primary">+ New Appraisal</Link>
      </div>

      {appraisals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>You haven't submitted any appraisals yet.</p>
            <Link to="/self-appraisal" className="btn btn-primary" style={{ marginTop: 16 }}>
              Submit Your First Appraisal
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Period</th>
                <th>Self Score</th>
                <th>Final Score</th>
                <th>Grade</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appraisals.map((a, i) => (
                <tr key={a._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td><strong>{a.period}</strong> {a.year}</td>
                  <td>{a.selfScore || '—'}</td>
                  <td>{a.finalScore || '—'}</td>
                  <td>
                    {a.grade && a.grade !== 'N/A'
                      ? <span className={`grade-badge grade-${a.grade}`}>{a.grade}</span>
                      : '—'}
                  </td>
                  <td>{a.managerId?.name || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelected(a)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <AppraisalDetail appraisal={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default MyAppraisals;
