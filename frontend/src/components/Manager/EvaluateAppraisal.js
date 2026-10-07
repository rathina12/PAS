// components/Manager/EvaluateAppraisal.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../Dashboard/Dashboard';

const CRITERIA = [
  { key: 'communication',   label: 'Communication',    icon: '💬' },
  { key: 'technicalSkills', label: 'Technical Skills', icon: '⚙️' },
  { key: 'teamwork',        label: 'Teamwork',         icon: '🤝' },
  { key: 'punctuality',     label: 'Punctuality',      icon: '⏰' },
  { key: 'leadership',      label: 'Leadership',       icon: '🌟' },
  { key: 'problemSolving',  label: 'Problem Solving',  icon: '🧩' },
];

const StarRating = ({ value, onChange, disabled }) => {
  const [hovered, setHovered] = useState(0);
  const labels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };
  return (
    <div>
      <div className="stars">
        {[1,2,3,4,5].map(n => (
          <button type="button"
            key={n}
            aria-label={`Rate ${n} out of 5`}
            aria-pressed={value === n}
            disabled={disabled}
            className={`star ${n <= (hovered || value) ? 'filled' : ''}`}
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            onMouseLeave={() => !disabled && setHovered(0)}
            title={labels[n]}
          >★</button>
        ))}
      </div>
      <div className="rating-desc">
        {(hovered || value) ? labels[hovered || value] : 'Click to rate'}
      </div>
    </div>
  );
};

const EvaluateAppraisal = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { addToast }  = useToast();

  const [appraisal, setAppraisal] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  const [form, setForm] = useState({
    managerRatings: {
      communication:0, technicalSkills:0, teamwork:0,
      punctuality:0,   leadership:0,      problemSolving:0
    },
    managerComments: {
      communication:'', technicalSkills:'', teamwork:'',
      punctuality:'',   leadership:'',      problemSolving:'',
      overall:'', strengths:'', improvements:''
    },
    status: 'approved'
  });

  useEffect(() => {
    axios.get(`/api/appraisals/${id}`)
      .then(r => {
        setAppraisal(r.data.appraisal);
        // Pre-fill if already evaluated
        if (r.data.appraisal.managerRatings?.communication) {
          setForm(prev => ({
            ...prev,
            managerRatings:  r.data.appraisal.managerRatings,
            managerComments: r.data.appraisal.managerComments || prev.managerComments,
            status:          r.data.appraisal.status
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const setRating  = (key, val)  => setForm(p => ({ ...p, managerRatings:  { ...p.managerRatings,  [key]: val } }));
  const setComment = (key, val)  => setForm(p => ({ ...p, managerComments: { ...p.managerComments, [key]: val } }));

  const calcAvg = () => {
    const vals = Object.values(form.managerRatings).filter(v => v > 0);
    return vals.length ? (vals.reduce((a,b) => a+b,0)/vals.length).toFixed(2) : 0;
  };

  const validate = () => {
    const errs = {};
    CRITERIA.forEach(c => {
      if (!form.managerRatings[c.key]) errs[c.key] = 'Rating required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      addToast('Validation Error', 'Please provide ratings for all criteria.', 'error');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`/api/appraisals/${id}/evaluate`, form);
      addToast('Evaluation Saved', 'Appraisal has been evaluated successfully.', 'success');
      navigate('/team-appraisals');
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!appraisal) return <div className="empty-state"><p>Appraisal not found.</p></div>;

  const emp    = appraisal.employeeId;
  const isReadOnly = appraisal.status === 'approved' || appraisal.status === 'rejected';

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Evaluate Appraisal</h2>
          <p>{emp?.name} · {appraisal.period} {appraisal.year}</p>
        </div>
        <StatusBadge status={appraisal.status} />
      </div>

      {/* Employee info card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Employee',    value: emp?.name },
              { label: 'Department',  value: emp?.department },
              { label: 'Designation', value: emp?.designation },
              { label: 'Self Score',  value: `${appraisal.selfScore || 0} / 5` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Self Appraisal (read-only left) */}
        <div>
          <h3 style={{ marginBottom: 14, fontSize: 16 }}>📄 Employee Self-Appraisal</h3>
          {CRITERIA.map(c => (
            <div key={c.key} className="rating-group">
              <div className="rating-group-label">{c.icon} {c.label}</div>
              <div className="stars" style={{ marginTop: 8 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`star ${n <= (appraisal.selfRatings?.[c.key] || 0) ? 'filled' : ''}`}
                    style={{ cursor: 'default' }}>★</span>
                ))}
              </div>
              {appraisal.selfComments?.[c.key] && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                  "{appraisal.selfComments[c.key]}"
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Manager Evaluation (right) */}
        <div>
          <h3 style={{ marginBottom: 14, fontSize: 16 }}>
            📝 {isReadOnly ? 'Your Evaluation' : 'Your Evaluation'}
          </h3>
          {CRITERIA.map(c => (
            <div key={c.key} className="rating-group">
              <div className="rating-group-label">{c.icon} {c.label}</div>
              <StarRating
                value={form.managerRatings[c.key]}
                onChange={val => setRating(c.key, val)}
                disabled={isReadOnly}
              />
              {errors[c.key] && <div className="form-error">{errors[c.key]}</div>}
              <textarea
                className="form-control"
                style={{ marginTop: 8, resize: 'vertical' }}
                placeholder={`Your comments on ${c.label.toLowerCase()}…`}
                value={form.managerComments[c.key]}
                onChange={e => setComment(c.key, e.target.value)}
                disabled={isReadOnly}
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overall manager comments */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>Overall Feedback</h3>
          <div style={{ fontSize: 14 }}>
            Your Score: <strong>{calcAvg()} / 5</strong>
          </div>
        </div>
        <div className="card-body">
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">💪 Key Strengths</label>
              <textarea className="form-control" rows={3}
                placeholder="What does this employee do really well?"
                value={form.managerComments.strengths}
                onChange={e => setComment('strengths', e.target.value)}
                disabled={isReadOnly} />
            </div>
            <div className="form-group">
              <label className="form-label">📈 Areas for Improvement</label>
              <textarea className="form-control" rows={3}
                placeholder="What should this employee work on?"
                value={form.managerComments.improvements}
                onChange={e => setComment('improvements', e.target.value)}
                disabled={isReadOnly} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">💬 Overall Feedback</label>
            <textarea className="form-control" rows={3}
              placeholder="Overall summary and recommendations…"
              value={form.managerComments.overall}
              onChange={e => setComment('overall', e.target.value)}
              disabled={isReadOnly} />
          </div>

          {!isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Decision</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="approved">✅ Approve</option>
                  <option value="rejected">❌ Reject</option>
                  <option value="under_review">🔄 Keep Under Review</option>
                </select>
              </div>
              <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }}
                onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : '✓ Submit Evaluation'}
              </button>
              <button className="btn btn-outline btn-lg" style={{ marginTop: 20 }}
                onClick={() => navigate(-1)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluateAppraisal;
