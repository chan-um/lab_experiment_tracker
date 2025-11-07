// API service layer for communicating with Flask backend
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  return data;
}

// Authentication API
export const authAPI = {
  async register(email, password, name) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ email, password, name }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/me`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async updateProfile(updates) {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },
};

// Groups API
export const groupsAPI = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async create(name) {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  async join(code) {
    const response = await fetch(`${API_BASE_URL}/groups/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  },

  async leave(groupId) {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async select(groupId) {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/select`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async getCurrent() {
    const response = await fetch(`${API_BASE_URL}/groups/current`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async getCurrentMembers() {
    const response = await fetch(`${API_BASE_URL}/groups/current/members`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Experiments API
export const experimentsAPI = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      credentials: 'include',
    });
    const data = await handleResponse(response);
    // Backend returns array directly, not wrapped in object
    return Array.isArray(data) ? data : (data.experiments || []);
  },

  async getById(expId) {
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}`, {
      credentials: 'include',
    });
    const data = await handleResponse(response);
    return data.experiment;
  },

  async create(experiment) {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(experiment),
    });
    const data = await handleResponse(response);
    return data.experiment;
  },

  async update(expId, updates) {
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await handleResponse(response);
    return data.experiment;
  },

  async addLog(expId, log) {
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(log),
    });
    const data = await handleResponse(response);
    return data.experiment; // Return the full updated experiment
  },

  async delete(expId) {
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Files API
export const filesAPI = {
  async upload(expId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}/files`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await handleResponse(response);
    return data.experiment; // Returns updated experiment with new file
  },

  async delete(expId, fileId) {
    const response = await fetch(`${API_BASE_URL}/experiments/${expId}/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await handleResponse(response);
    return data.experiment; // Returns updated experiment
  },

  getDownloadUrl(expId, fileId) {
    return `${API_BASE_URL}/experiments/${expId}/files/${fileId}/download`;
  },
};

