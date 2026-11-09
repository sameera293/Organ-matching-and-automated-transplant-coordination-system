import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { HeartHandshake, Plus, Clock, AlertTriangle, Cpu, Trash2, Activity } from 'lucide-react';

export default function Organs({ setActivePage, setSelectedOrganId }) {
  const [organs, setOrgans] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    organ_id: '',
    donor_id: '',
    organ_type: 'Kidney',
    blood_group: 'O+',
    preservation_limit: 30.0,
    current_location: 'Metro Health University Medical Center',
    status: 'Available'
  });

  const ORGAN_PRESETS = {
    'Kidney': { limit: 30.0 },
    'Liver': { limit: 12.0 },
    'Heart': { limit: 5.0 },
    'Lung': { limit: 7.0 },
    'Pancreas': { limit: 16.0 }
  };

  const fetchOrgansAndDonors = async () => {
    try {
      setLoading(true);
      const [organsRes, donorsRes] = await Promise.all([
        api.getOrgans({
          organ_type: typeFilter || undefined,
          status: statusFilter || undefined
        }),
        api.getDonors()
      ]);
      setOrgans(organsRes);
      setDonors(donorsRes);
      if (donorsRes.length > 0 && !formData.donor_id) {
        setFormData(prev => ({
          ...prev,
          donor_id: donorsRes[0].donor_id,
          blood_group: donorsRes[0].blood_group,
          current_location: donorsRes[0].location
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgansAndDonors();
  }, [typeFilter, statusFilter]);

  const handleOrganTypeChange = (type) => {
    setFormData({
      ...formData,
      organ_type: type,
      preservation_limit: ORGAN_PRESETS[type]?.limit || 24.0
    });
  };

  const handleDonorSelect = (donorId) => {
    const selectedDonor = donors.find(d => d.donor_id === donorId);
    if (selectedDonor) {
      setFormData({
        ...formData,
        donor_id: donorId,
        blood_group: selectedDonor.blood_group,
        current_location: selectedDonor.location
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createOrgan(formData);
      setIsAddModalOpen(false);
      fetchOrgansAndDonors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMatchOrgan = (organId) => {
    if (setSelectedOrganId) {
      setSelectedOrganId(organId);
    }
    setActivePage('matching');
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to remove organ ${id}?`)) return;
    try {
      await api.deleteOrgan(id);
      fetchOrgansAndDonors();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Organ Recovery & Preservation Inventory</h1>
          <p className="page-subtitle">
            Track available donor organs, retrieval timestamps, cold ischemia windows, and preservation limits.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Register Retrieved Organ</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="filter-bar">
          <div style={{ width: '200px' }}>
            <select 
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Organ Types</option>
              {['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '200px' }}>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {['Available', 'Reserved for Review', 'In Transit', 'Transplanted', 'Expired'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Organs Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Activity className="animate-spin" size={28} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
            Loading organ inventory...
          </div>
        ) : organs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No organ records found matching criteria.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organ ID</th>
                  <th>Type</th>
                  <th>Blood Group</th>
                  <th>Current Location</th>
                  <th>Preservation Remaining</th>
                  <th>Status</th>
                  <th>Donor Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organs.map((org) => {
                  const remaining = org.preservation_remaining_hours ?? org.preservation_limit;
                  const isCritical = remaining < 2.5;
                  const isWarning = remaining < 6.0;

                  return (
                    <tr key={org.organ_id}>
                      <td><strong>{org.organ_id}</strong></td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--secondary)' }}>
                          {org.organ_type}
                        </span>
                      </td>
                      <td>
                        <Badge variant="info">{org.blood_group}</Badge>
                      </td>
                      <td>{org.current_location}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'} />
                          <span style={{ 
                            fontWeight: '600',
                            color: isCritical ? '#ef4444' : isWarning ? '#b45309' : '#059669'
                          }}>
                            {remaining.toFixed(1)} / {org.preservation_limit} hrs
                          </span>
                        </div>
                        {org.is_approaching_limit && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700', marginTop: '2px' }}>
                            Approaching Ischemia Limit!
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge 
                          variant={
                            org.status === 'Available' ? 'success' :
                            org.status === 'Reserved for Review' ? 'warning' :
                            org.status === 'In Transit' ? 'info' : 'secondary'
                          }
                        >
                          {org.status}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {org.donor_id}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {org.status === 'Available' && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMatchOrgan(org.organ_id)}
                              title="Launch AI matching for this organ"
                            >
                              <Cpu size={14} />
                              <span>Match</span>
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(org.organ_id)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete organ record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Organ Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Retrieved Organ"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Linked Donor Profile</label>
            <select 
              className="form-control"
              value={formData.donor_id}
              onChange={(e) => handleDonorSelect(e.target.value)}
              required
            >
              {donors.map(d => (
                <option key={d.donor_id} value={d.donor_id}>
                  {d.donor_id} - Age {d.age}, {d.blood_group} ({d.location})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Organ Type</label>
              <select 
                className="form-control"
                value={formData.organ_type}
                onChange={(e) => handleOrganTypeChange(e.target.value)}
              >
                {['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.blood_group}
                readOnly
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Preservation Window (Max Hours)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-control"
                value={formData.preservation_limit}
                onChange={(e) => setFormData({ ...formData, preservation_limit: parseFloat(e.target.value) || 24.0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Reserved for Review">Reserved for Review</option>
                <option value="In Transit">In Transit</option>
                <option value="Transplanted">Transplanted</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Current Hospital Location</label>
            <input 
              type="text" 
              className="form-control"
              value={formData.current_location}
              onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Organ Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
