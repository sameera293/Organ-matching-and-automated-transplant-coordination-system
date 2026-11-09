import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  HeartHandshake, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Dashboard({ setActivePage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <Activity className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <p>Loading decision-support metrics and system status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>Error loading dashboard:</strong> {error}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={fetchSummary}>
          Retry
        </button>
      </div>
    );
  }

  const { stats, organ_distribution, urgency_distribution, recent_matches, recent_notifications } = data;

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const URGENCY_COLORS = ['#94a3b8', '#38bdf8', '#0284c7', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transplant Coordination Overview</h1>
          <p className="page-subtitle">
            Real-time decision support, organ inventory, and multi-factor matching intelligence.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setActivePage('matching')}>
            <Activity size={16} />
            <span>Launch Matching</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage('optimization')}>
            <HeartHandshake size={16} />
            <span>Multi-Organ Hungarian</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <HeartHandshake size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.available_organs}</div>
            <div className="stat-label">Available Organs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.active_recipients}</div>
            <div className="stat-label">Active Waitlist</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.high_urgency_recipients}</div>
            <div className="stat-label">Critical Urgency (Tier 4-5)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.pending_reviews}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Available Organs by Type</h3>
            <span className="badge badge-secondary">{stats.available_organs} Total Available</span>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={organ_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="organ_type" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Waitlist Urgency Distribution</h3>
            <span className="badge badge-secondary">{stats.active_recipients} Candidates</span>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={urgency_distribution}
                  dataKey="count"
                  nameKey="urgency_level"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {urgency_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={URGENCY_COLORS[index % URGENCY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Matches & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        {/* Recent Matches */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Decision-Support Matches</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setActivePage('review')}>
              View All
            </button>
          </div>
          {recent_matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)' }}>
              No matches generated yet. Launch the Matching Engine to evaluate an available organ.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Organ</th>
                    <th>Candidate</th>
                    <th>AI Score</th>
                    <th>Rank</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_matches.map((m) => (
                    <tr key={m.match_id}>
                      <td>
                        <strong>{m.organ_id}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.organ_type}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{m.recipient_name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.recipient_id}</div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: '700' }}>
                          {m.ai_score ? m.ai_score.toFixed(3) : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">#{m.rank || '-'}</span>
                      </td>
                      <td>
                        <span className={`badge ${m.review_status === 'Reviewed' ? 'badge-success' : 'badge-warning'}`}>
                          {m.review_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Notification Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Live Coordination Alerts</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setActivePage('notifications')}>
              View Feed
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recent_notifications.map((n) => (
              <div 
                key={n.notification_id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: n.severity === 'CRITICAL' ? '#fef2f2' : n.severity === 'WARNING' ? '#fffbeb' : '#f8fafc',
                  border: `1px solid ${n.severity === 'CRITICAL' ? '#fecaca' : n.severity === 'WARNING' ? '#fde68a' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {n.severity === 'CRITICAL' ? (
                    <AlertTriangle size={18} color="#ef4444" />
                  ) : n.severity === 'WARNING' ? (
                    <Clock size={18} color="#f59e0b" />
                  ) : (
                    <Activity size={18} color="#0284c7" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--secondary)' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(n.created_at).toLocaleTimeString()} • {n.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
