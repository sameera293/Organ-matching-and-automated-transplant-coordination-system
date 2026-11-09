/**
 * Frontend API Service Layer.
 * Communicates with FastAPI backend endpoints.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { detail: res.statusText };
      }
      throw new Error(errorData.detail || errorData.message || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),

  // Donors
  getDonors: (params = {}) => {
    const q = new URLSearchParams(cleanParams(params)).toString();
    return request(`/donors${q ? '?' + q : ''}`);
  },
  getDonor: (id) => request(`/donors/${id}`),
  createDonor: (data) => request('/donors', { method: 'POST', body: JSON.stringify(data) }),
  updateDonor: (id, data) => request(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDonor: (id) => request(`/donors/${id}`, { method: 'DELETE' }),

  // Organs
  getOrgans: (params = {}) => {
    const q = new URLSearchParams(cleanParams(params)).toString();
    return request(`/organs${q ? '?' + q : ''}`);
  },
  getOrgan: (id) => request(`/organs/${id}`),
  createOrgan: (data) => request('/organs', { method: 'POST', body: JSON.stringify(data) }),
  updateOrgan: (id, data) => request(`/organs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrgan: (id) => request(`/organs/${id}`, { method: 'DELETE' }),

  // Recipients
  getRecipients: (params = {}) => {
    const q = new URLSearchParams(cleanParams(params)).toString();
    return request(`/recipients${q ? '?' + q : ''}`);
  },
  getRecipient: (id) => request(`/recipients/${id}`),
  createRecipient: (data) => request('/recipients', { method: 'POST', body: JSON.stringify(data) }),
  updateRecipient: (id, data) => request(`/recipients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecipient: (id) => request(`/recipients/${id}`, { method: 'DELETE' }),

  // Matching
  runMatching: (data) => request('/matching/run', { method: 'POST', body: JSON.stringify(data) }),
  getMatchHistory: (organId) => request(`/matching/${organId}`),
  updateMatchReview: (matchId, data) => request(`/matching/review/${matchId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Explainability (SHAP)
  explainMatch: (data) => request('/explain', { method: 'POST', body: JSON.stringify(data) }),

  // Logistics
  getTransitNetwork: () => request('/logistics/network'),
  calculateRoute: (data) => request('/logistics/route', { method: 'POST', body: JSON.stringify(data) }),

  // Multi-Organ Hungarian Optimization
  runHungarianOptimization: (data = {}) => request('/optimization/run', { method: 'POST', body: JSON.stringify(data) }),

  // Scenarios
  runScenarioSimulation: (data) => request('/scenario/run', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/notifications${q ? '?' + q : ''}`);
  },
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // ML Evaluation & Fairness
  getModelEvaluations: () => request('/ml/evaluation'),
  triggerRetraining: () => request('/ml/train', { method: 'POST' }),
  getFairnessEvaluation: () => request('/fairness/evaluation'),
};
