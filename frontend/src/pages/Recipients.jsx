import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  UserCheck,
  Plus,
  Search,
  Trash2,
  Edit3,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function Recipients() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [organFilter, setOrganFilter] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);

  const [formData, setFormData] = useState({
    recipient_id: '',
    name: '',
    age: 40,
    blood_group: 'O+',
    required_organ: 'Kidney',
    medical_urgency: 3,
    waiting_time: 30,
    hospital: 'Metro Health University Medical Center',
    location: 'Warangal',
    eligibility_status: 'Eligible'
  });

  // ============================================================
  // LOAD RECIPIENTS
  // ============================================================

  const fetchRecipients = async () => {
    try {
      setLoading(true);

      const data = await api.getRecipients({
        search: search || undefined,
        required_organ: organFilter || undefined,
        blood_group: bloodFilter || undefined,
        min_urgency: urgencyFilter
          ? Number(urgencyFilter)
          : undefined
      });

      setRecipients(data);
    } catch (err) {
      console.error('Failed to load recipients:', err);
      alert(`Failed to load recipients: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, [organFilter, bloodFilter, urgencyFilter]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecipients();
  };

  // ============================================================
  // FORM HANDLING
  // ============================================================

  const resetForm = () => {
    setFormData({
      recipient_id: '',
      name: '',
      age: 40,
      blood_group: 'O+',
      required_organ: 'Kidney',
      medical_urgency: 3,
      waiting_time: 30,
      hospital: 'Metro Health University Medical Center',
      location: 'Warangal',
      eligibility_status: 'Eligible'
    });
  };

  const openAddModal = () => {
    setEditingRecipient(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (recipient) => {
    setEditingRecipient(recipient);

    setFormData({
      recipient_id: recipient.recipient_id || '',
      name: recipient.name || '',
      age: recipient.age ?? 40,
      blood_group: recipient.blood_group || 'O+',
      required_organ: recipient.required_organ || 'Kidney',
      medical_urgency: recipient.medical_urgency ?? 3,
      waiting_time: recipient.waiting_time ?? 30,
      hospital: recipient.hospital || '',
      location: recipient.location || '',
      eligibility_status: recipient.eligibility_status || 'Eligible'
    });

    setIsModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        medical_urgency: Number(formData.medical_urgency),
        waiting_time: Number(formData.waiting_time)
      };

      if (editingRecipient) {
        await api.updateRecipient(
          editingRecipient.recipient_id,
          payload
        );

        alert('Recipient record updated successfully.');
      } else {
        await api.createRecipient(payload);

        alert('Recipient registered successfully.');
      }

      setIsModalOpen(false);
      setEditingRecipient(null);
      resetForm();

      await fetchRecipients();

    } catch (err) {
      console.error('Recipient save error:', err);
      alert(`Unable to save recipient: ${err.message}`);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (recipientId) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove recipient ${recipientId}?`
    );

    if (!confirmed) return;

    try {
      await api.deleteRecipient(recipientId);

      alert('Recipient removed successfully.');

      await fetchRecipients();

    } catch (err) {
      console.error('Delete recipient error:', err);
      alert(`Unable to delete recipient: ${err.message}`);
    }
  };

  // ============================================================
  // URGENCY BADGE
  // ============================================================

  const getUrgencyVariant = (urgency) => {
    if (urgency >= 5) return 'danger';
    if (urgency >= 4) return 'warning';
    if (urgency >= 3) return 'info';
    return 'secondary';
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Eligible':
        return 'success';

      case 'Suspended':
        return 'warning';

      case 'Transplanted':
        return 'info';

      case 'Inactive':
        return 'secondary';

      default:
        return 'secondary';
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div>

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="page-header">

        <div>
          <h1 className="page-title">
            Recipient Registry
          </h1>

          <p className="page-subtitle">
            Manage recipient profiles, transplant requirements,
            waiting time and medical urgency information.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Register Recipient</span>
        </button>

      </div>


      {/* ======================================================
          SEARCH / FILTERS
      ======================================================= */}

      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px'
        }}
      >

        <form
          onSubmit={handleSearchSubmit}
          className="filter-bar"
        >

          {/* Search */}

          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '220px'
            }}
          >

            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '11px',
                color: 'var(--text-muted)'
              }}
            />

            <input
              type="text"
              className="form-control"
              style={{
                paddingLeft: '32px'
              }}
              placeholder="Search by Recipient ID, Name or Hospital..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* Organ Filter */}

          <div style={{ width: '160px' }}>

            <select
              className="form-control"
              value={organFilter}
              onChange={(e) =>
                setOrganFilter(e.target.value)
              }
            >

              <option value="">
                All Organs
              </option>

              <option value="Kidney">
                Kidney
              </option>

              <option value="Liver">
                Liver
              </option>

              <option value="Heart">
                Heart
              </option>

              <option value="Lung">
                Lung
              </option>

              <option value="Pancreas">
                Pancreas
              </option>

            </select>

          </div>


          {/* Blood Group */}

          <div style={{ width: '150px' }}>

            <select
              className="form-control"
              value={bloodFilter}
              onChange={(e) =>
                setBloodFilter(e.target.value)
              }
            >

              <option value="">
                All Blood Groups
              </option>

              {[
                'O-',
                'O+',
                'A-',
                'A+',
                'B-',
                'B+',
                'AB-',
                'AB+'
              ].map((bg) => (
                <option
                  key={bg}
                  value={bg}
                >
                  {bg}
                </option>
              ))}

            </select>

          </div>


          {/* Urgency */}

          <div style={{ width: '150px' }}>

            <select
              className="form-control"
              value={urgencyFilter}
              onChange={(e) =>
                setUrgencyFilter(e.target.value)
              }
            >

              <option value="">
                All Urgency
              </option>

              <option value="5">
                Level 5+
              </option>

              <option value="4">
                Level 4+
              </option>

              <option value="3">
                Level 3+
              </option>

              <option value="2">
                Level 2+
              </option>

              <option value="1">
                Level 1+
              </option>

            </select>

          </div>


          <button
            type="submit"
            className="btn btn-secondary"
          >
            Search
          </button>

        </form>

      </div>


      {/* ======================================================
          RECIPIENT TABLE
      ======================================================= */}

      <div className="card">

        {loading ? (

          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)'
            }}
          >

            <Activity
              className="animate-spin"
              size={28}
              color="var(--primary)"
              style={{
                margin: '0 auto 10px'
              }}
            />

            Loading recipients...

          </div>

        ) : recipients.length === 0 ? (

          <div
            style={{
              textAlign: 'center',
              padding: '50px',
              color: 'var(--text-secondary)'
            }}
          >

            <UserCheck
              size={42}
              style={{
                margin: '0 auto 12px',
                opacity: 0.5
              }}
            />

            <div style={{ fontSize: '1rem' }}>
              No recipient records found.
            </div>

            <div
              style={{
                marginTop: '6px',
                fontSize: '0.85rem'
              }}
            >
              Register a recipient to begin
              AI-assisted matching analysis.
            </div>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>Recipient ID</th>

                  <th>Name</th>

                  <th>Age</th>

                  <th>Blood Group</th>

                  <th>Required Organ</th>

                  <th>Urgency</th>

                  <th>Waiting</th>

                  <th>Hospital</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>

              </thead>


              <tbody>

                {recipients.map((recipient) => (

                  <tr
                    key={recipient.recipient_id}
                  >

                    <td>
                      <strong>
                        {recipient.recipient_id}
                      </strong>
                    </td>


                    <td>
                      {recipient.name}
                    </td>


                    <td>
                      {recipient.age} yrs
                    </td>


                    <td>

                      <Badge
                        variant={
                          recipient.blood_group.includes('O')
                            ? 'success'
                            : 'info'
                        }
                      >
                        {recipient.blood_group}
                      </Badge>

                    </td>


                    <td>

                      <strong>
                        {recipient.required_organ}
                      </strong>

                    </td>


                    <td>

                      <Badge
                        variant={getUrgencyVariant(
                          recipient.medical_urgency
                        )}
                      >

                        {recipient.medical_urgency >= 4 && (
                          <AlertTriangle
                            size={12}
                            style={{
                              marginRight: '4px',
                              verticalAlign: 'middle'
                            }}
                          />
                        )}

                        Level {recipient.medical_urgency}

                      </Badge>

                    </td>


                    <td>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >

                        <Clock size={14} />

                        {recipient.waiting_time} days

                      </div>

                    </td>


                    <td>
                      {recipient.hospital}
                    </td>


                    <td>

                      <Badge
                        variant={getStatusVariant(
                          recipient.eligibility_status
                        )}
                      >
                        {recipient.eligibility_status}
                      </Badge>

                    </td>


                    <td>

                      <div
                        style={{
                          display: 'flex',
                          gap: '6px'
                        }}
                      >

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            openEditModal(recipient)
                          }
                          title="Edit recipient"
                        >
                          <Edit3 size={14} />
                        </button>


                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            handleDelete(
                              recipient.recipient_id
                            )
                          }
                          title="Delete recipient"
                          style={{
                            color: 'var(--danger)'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================================
          ADD / EDIT RECIPIENT MODAL
      ======================================================= */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecipient(null);
        }}
        title={
          editingRecipient
            ? 'Edit Recipient Record'
            : 'Register New Recipient'
        }
        maxWidth="850px"
      >

        <form onSubmit={handleSubmit}>

          {/* Recipient ID */}

          <div className="form-group">

            <label className="form-label">
              Recipient Identifier
              {!editingRecipient &&
                ' (Optional - Auto Generated if blank)'}
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. REC-001"
              value={formData.recipient_id}
              disabled={!!editingRecipient}
              onChange={(e) =>
                handleFormChange(
                  'recipient_id',
                  e.target.value
                )
              }
            />

          </div>


          {/* Name */}

          <div className="form-group">

            <label className="form-label">
              Recipient Name / Code
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. RECIPIENT-001"
              value={formData.name}
              onChange={(e) =>
                handleFormChange(
                  'name',
                  e.target.value
                )
              }
              required
            />

          </div>


          {/* Age + Blood Group */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '14px'
            }}
          >

            <div className="form-group">

              <label className="form-label">
                Recipient Age
              </label>

              <input
                type="number"
                className="form-control"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) =>
                  handleFormChange(
                    'age',
                    parseInt(e.target.value) || 0
                  )
                }
                required
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Blood Group
              </label>

              <select
                className="form-control"
                value={formData.blood_group}
                onChange={(e) =>
                  handleFormChange(
                    'blood_group',
                    e.target.value
                  )
                }
              >

                {[
                  'O-',
                  'O+',
                  'A-',
                  'A+',
                  'B-',
                  'B+',
                  'AB-',
                  'AB+'
                ].map((bg) => (

                  <option
                    key={bg}
                    value={bg}
                  >
                    {bg}
                  </option>

                ))}

              </select>

            </div>

          </div>


          {/* Organ + Urgency */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '14px'
            }}
          >

            <div className="form-group">

              <label className="form-label">
                Required Organ
              </label>

              <select
                className="form-control"
                value={formData.required_organ}
                onChange={(e) =>
                  handleFormChange(
                    'required_organ',
                    e.target.value
                  )
                }
              >

                <option value="Kidney">
                  Kidney
                </option>

                <option value="Liver">
                  Liver
                </option>

                <option value="Heart">
                  Heart
                </option>

                <option value="Lung">
                  Lung
                </option>

                <option value="Pancreas">
                  Pancreas
                </option>

              </select>

            </div>


            <div className="form-group">

              <label className="form-label">
                Medical Urgency
              </label>

              <select
                className="form-control"
                value={formData.medical_urgency}
                onChange={(e) =>
                  handleFormChange(
                    'medical_urgency',
                    Number(e.target.value)
                  )
                }
              >

                <option value={1}>
                  1 - Low
                </option>

                <option value={2}>
                  2 - Moderate
                </option>

                <option value={3}>
                  3 - Normal
                </option>

                <option value={4}>
                  4 - High
                </option>

                <option value={5}>
                  5 - Critical
                </option>

              </select>

            </div>

          </div>


          {/* Waiting Time */}

          <div className="form-group">

            <label className="form-label">
              Waiting Time (Days)
            </label>

            <input
              type="number"
              className="form-control"
              min="0"
              value={formData.waiting_time}
              onChange={(e) =>
                handleFormChange(
                  'waiting_time',
                  parseInt(e.target.value) || 0
                )
              }
              required
            />

          </div>


          {/* Hospital */}

          <div className="form-group">

            <label className="form-label">
              Transplant Hospital
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. Metro Health University Medical Center"
              value={formData.hospital}
              onChange={(e) =>
                handleFormChange(
                  'hospital',
                  e.target.value
                )
              }
              required
            />

          </div>


          {/* Location */}

          <div className="form-group">

            <label className="form-label">
              Geographic Location
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. Warangal"
              value={formData.location}
              onChange={(e) =>
                handleFormChange(
                  'location',
                  e.target.value
                )
              }
              required
            />

          </div>


          {/* Eligibility */}

          <div className="form-group">

            <label className="form-label">
              Eligibility Status
            </label>

            <select
              className="form-control"
              value={formData.eligibility_status}
              onChange={(e) =>
                handleFormChange(
                  'eligibility_status',
                  e.target.value
                )
              }
            >

              <option value="Eligible">
                Eligible
              </option>

              <option value="Suspended">
                Suspended
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="Transplanted">
                Transplanted
              </option>

            </select>

          </div>


          {/* Buttons */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px'
            }}
          >

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRecipient(null);
              }}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="btn btn-primary"
            >

              {editingRecipient
                ? 'Update Recipient Record'
                : 'Register Recipient Record'}

            </button>

          </div>

        </form>

      </Modal>

    </div>
  );
}