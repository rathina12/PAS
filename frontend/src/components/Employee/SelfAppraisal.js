// components/Employee/SelfAppraisal.js
// Full-screen appraisal form with star ratings and comments

import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';

// ── Star Rating Component ────────────────────────────────────
const StarRating = ({ value, onChange, disabled }) => {
  const [hovered, setHovered] = useState(0);

  const labels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };

  return (
    <div>
      <div className="stars">
        {[1, 2, 3, 4, 5].map(n => (
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
          >
            ★
          </button>
        ))}
      </div>
      <div className="rating-desc">
        {(hovered || value) ? labels[hovered || value] : 'Click to rate'}
      </div>
    </div>
  );
};

// ── Criteria config ──────────────────────────────────────────
const CRITERIA = [
  { key: 'communication',   label: 'Communication',    icon: '💬', desc: 'Ability to convey ideas clearly and listen effectively' },
  { key: 'technicalSkills', label: 'Technical Skills', icon: '⚙️', desc: 'Proficiency in required tools, technologies and processes' },
  { key: 'teamwork',        label: 'Teamwork',         icon: '🤝', desc: 'Collaboration, cooperation and contributing to team goals' },
  { key: 'punctuality',     label: 'Punctuality',      icon: '⏰', desc: 'Attendance, meeting deadlines and time management' },
  { key: 'leadership',      label: 'Leadership',       icon: '🌟', desc: 'Initiative, mentoring others and driving results' },
  { key: 'problemSolving',  label: 'Problem Solving',  icon: '🧩', desc: 'Analytical thinking and finding effective solutions' },
];

const PERIODS = [new Date().getFullYear(), new Date().getFullYear() - 1]
  .flatMap(year => [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`, `H1 ${year}`, `H2 ${year}`, `Annual ${year}`]);

const SelfAppraisal = () => {
  const { user }    = useContext(AuthContext);
  const { addToast } = useToast();

  const [step,    setStep]    = useState(1); // 1 = intro, 2 = form, 3 = submitted
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const [form, setForm] = useState({
    period: '',
    selfRatings: {
      communication: 0, technicalSkills: 0, teamwork: 0,
      punctuality: 0,   leadership: 0,      problemSolving: 0
    },
    selfComments: {
      communication: '', technicalSkills: '', teamwork: '',
      punctuality: '',   leadership: '',      problemSolving: '', overall: ''
    }
  });

  const setRating = (key, val) => {
    setForm(prev => ({ ...prev, selfRatings: { ...prev.selfRatings, [key]: val } }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const setComment = (key, val) => {
    setForm(prev => ({ ...prev, selfComments: { ...prev.selfComments, [key]: val } }));
  };

  // Auto-calculate average score
  const calcAvg = () => {
    const vals = Object.values(form.selfRatings).filter(v => v > 0);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  };

  const validate = () => {
    const errs = {};
    if (!form.period) errs.period = 'Please select an appraisal period.';
    CRITERIA.forEach(c => {
      if (!form.selfRatings[c.key]) errs[c.key] = 'Rating required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      addToast('Validation Error', 'Please fill all required fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/appraisals', {
        period:       form.period,
        selfRatings:  form.selfRatings,
        selfComments: form.selfComments
      });
      setStep(3);
      addToast('Appraisal Submitted!', 'Your self-appraisal has been submitted successfully.', 'success');
    } catch (err) {
      addToast('Submission Failed', err.response?.data?.message || 'Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Intro ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fullscreen-modal">
        <div className="fullscreen-header">
          <div>
            <h2>Self-Appraisal Form</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Honest self-reflection helps you grow and guides your manager's evaluation
            </p>
          </div>
        </div>
        <div className="fullscreen-body">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <h3 style={{ marginBottom: 16, fontSize: 18 }}>📋 Before You Begin</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                This self-appraisal covers <strong>6 core performance areas</strong>. You will rate yourself
                on a scale of 1–5 and optionally add comments for each area.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                {CRITERIA.map(c => (
                  <div key={c.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg)', padding: '10px 14px', borderRadius: 8
                  }}>
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Select Appraisal Period <span className="required">*</span></label>
                <select
                  className={`form-control ${errors.period ? 'error' : ''}`}
                  value={form.period}
                  onChange={e => { setForm(p => ({ ...p, period: e.target.value })); setErrors(p => ({ ...p, period: '' })); }}
                  style={{ maxWidth: 280 }}
                >
                  <option value="">-- Select Period --</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.period && <div className="form-error">{errors.period}</div>}
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => form.period ? setStep(2) : setErrors({ period: 'Please select a period.' })}
              >
                Start Appraisal →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Success ────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="fullscreen-modal">
        <div className="fullscreen-header">
          <h2>Appraisal Submitted</h2>
        </div>
        <div className="fullscreen-body" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Appraisal Submitted Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>
            Your self-appraisal for <strong>{form.period}</strong> has been submitted.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Your calculated self-score: <strong>{calcAvg()} / 5</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Your manager will review it soon and provide their evaluation.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/my-appraisals" className="btn btn-primary btn-lg">View My Appraisals</Link>
            <button onClick={() => { setStep(1); setForm({ period: '', selfRatings: { communication:0,technicalSkills:0,teamwork:0,punctuality:0,leadership:0,problemSolving:0 }, selfComments: { communication:'',technicalSkills:'',teamwork:'',punctuality:'',leadership:'',problemSolving:'',overall:'' } }); }} className="btn btn-outline btn-lg">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: The form ───────────────────────────────────────
  return (
    <div className="fullscreen-modal">
      <div className="fullscreen-header">
        <div>
          <h2>Self-Appraisal · {form.period}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Rate yourself honestly across all 6 performance criteria
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Running Average</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{calcAvg()} / 5</div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting…' : '✓ Submit Appraisal'}
          </button>
        </div>
      </div>

      <div className="fullscreen-body">
        {/* Rating criteria */}
        {CRITERIA.map(c => (
          <div key={c.key} className="rating-group">
            <div className="rating-group-header">
              <div className="rating-group-label">
                {c.icon} &nbsp; {c.label}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {c.desc}
                </span>
              </div>
            </div>
            <StarRating
              value={form.selfRatings[c.key]}
              onChange={val => setRating(c.key, val)}
            />
            {errors[c.key] && <div className="form-error">{errors[c.key]}</div>}
            <textarea
              className="form-control"
              style={{ marginTop: 10, resize: 'vertical', minHeight: 70 }}
              placeholder={`Comments about your ${c.label.toLowerCase()} (optional)…`}
              value={form.selfComments[c.key]}
              onChange={e => setComment(c.key, e.target.value)}
              rows={2}
            />
          </div>
        ))}

        {/* Overall comments */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3>Overall Comments</h3></div>
          <div className="card-body">
            <textarea
              className="form-control"
              rows={4}
              placeholder="Share your overall thoughts, achievements, challenges, and goals for the next period…"
              value={form.selfComments.overall}
              onChange={e => setComment('overall', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, marginBottom: 40 }}>
          <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : '✓ Submit Self-Appraisal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfAppraisal;
