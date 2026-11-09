import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Users, Plus, Search, Filter, Trash2, Edit3, Activity } from 'lucide-react';

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    donor_id: '',
    age: 40,
    blood_group: 'O+',
    gender: 'Male',
    location: 'Metro Health University Medical Center',
    donor_status: 'Deceased Donor'
  });

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await api.getDonors({
        search: search || undefined,
        blood_group: bloodFilter || undefined
      });
      setDonors(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [bloodFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonors();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createDonor(formData);
      setIsAddModalOpen(false);
      setFormData({
        donor_id: '',
        age: 40,
        blood_group: 'O+',
        gender: 'Male',
        location: 'Metro Health University Medical Center',
        donor_status: 'Deceased Donor'
      });
      fetchDonors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to deactivate donor ${id}?`)) return;
    try {
      await api.deleteDonor(id);
      fetchDonors();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Donor Registry</h1>
          <p className="page-subtitle">
            Manage donor records, non-sensitive demographic profiles, and blood group categorization.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} />
          <span>Register Donor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '32px' }}
              placeholder="Search by Donor ID or Hospital Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select 
              className="form-control" 
              value={bloodFilter} 
              onChange={(e) => setBloodFilter(e.target.value)}
            >
              <option value="">All Blood Groups</option>
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Donors Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Activity className="animate-spin" size={28} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
            Loading donors...
          </div>
        ) : donors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No donor records found matching filter criteria.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Donor ID</th>
                  <th>Age</th>
                  <th>Blood Group</th>
                  <th>Gender</th>
                  <th>Hospital Location</th>
                  <th>Donor Status</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.donor_id}>
                    <td><strong>{d.donor_id}</strong></td>
                    <td>{d.age} yrs</td>
                    <td>
                      <Badge variant={d.blood_group.includes('O') ? 'success' : 'info'}>
                        {d.blood_group}
                      </Badge>
                    </td>
                    <td>{d.gender}</td>
                    <td>{d.location}</td>
                    <td>
                      <Badge variant={d.donor_status === 'Active' ? 'success' : 'secondary'}>
                        {d.donor_status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(d.registration_date).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleDelete(d.donor_id)}
                        title="Deactivate donor"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Donor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Organ Donor"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Donor Identifier (Optional - Auto Generated if blank)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. DON-890" 
              value={formData.donor_id}
              onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Donor Age</label>
              <input 
                type="number" 
                className="form-control" 
                min="18" 
                max="85"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select 
                className="form-control" 
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-control"
                value={formData.donor_status}
                onChange={(e) => setFormData({ ...formData, donor_status: e.target.value })}
              >
                <option value="Deceased Donor">Deceased Donor</option>
                <option value="Active">Active Donor</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hospital / Recovery Facility</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Donor Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
