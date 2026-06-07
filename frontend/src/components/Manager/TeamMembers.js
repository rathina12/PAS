// components/Manager/TeamMembers.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const TeamMembers = () => {
  const { user }   = useContext(AuthContext);
  const [team, setTeam]       = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(
          user.role === 'admin' ? '/api/users?role=employee' : '/api/users/team'
        );
        const members = user.role === 'admin' ? res.data.users : res.data.employees;
        setTeam(members || []);

        // Fetch appraisal counts for each member
        const counts = {};
        await Promise.all(members.map(async (m) => {
          try {
            const r = await axios.get(`/api/reports/employee/${m._id}`);
            counts[m._id] = r.data.stats;
          } catch { counts[m._id] = null; }
        }));
        setReports(counts);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [user.role]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Team Members</h2>
          <p>{team.length} employee{team.length !== 1 ? 's' : ''} in your team</p>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No team members assigned yet.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
          {team.map(member => {
            const stats = reports[member._id];
            return (
              <div key={member._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  height: 6,
                  background: stats?.avgScore >= 4 ? 'var(--secondary)' :
                              stats?.avgScore >= 3 ? 'var(--primary)' :
                              stats?.avgScore >= 2 ? 'var(--warning)' : 'var(--border)'
                }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, flexShrink: 0
                    }}>
                      {initials(member.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{member.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {member.designation} · {member.department}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {member.email}
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 8, marginBottom: 16
                  }}>
                    {[
                      { label: 'Appraisals', value: stats?.total ?? '—' },
                      { label: 'Approved',   value: stats?.approved ?? '—' },
                      { label: 'Avg Score',  value: stats?.avgScore ?? '—' },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: 'var(--bg)', borderRadius: 8,
                        padding: '8px 10px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/team-appraisals?employee=${member._id}`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View Appraisals
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
