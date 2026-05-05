/**
 * api.js — Shared API Utility
 * Handles all fetch calls to the backend and JWT token management.
 */

const API_BASE = 'https://lnmiit-lms.onrender.com/api';

// --- Token Management ---
const Auth = {
  getToken: () => localStorage.getItem('lms_token'),
  setToken: (token) => localStorage.setItem('lms_token', token),
  removeToken: () => localStorage.removeItem('lms_token'),

  getUser: () => {
    const user = localStorage.getItem('lms_user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => localStorage.setItem('lms_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('lms_user'),

  isLoggedIn: () => !!localStorage.getItem('lms_token'),

  logout: () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    window.location.href = '/login.html';
  },

  // Redirect if not authenticated
  require: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  // Redirect if not admin
  requireAdmin: () => {
    const user = Auth.getUser();
    if (!Auth.isLoggedIn() || !user || user.role !== 'admin') {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
};

// --- Core Fetch Wrapper ---
async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// --- API Methods ---
const API = {
  // Auth
  register: (body)         => apiFetch('/users/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body)         => apiFetch('/users/login',    { method: 'POST', body: JSON.stringify(body) }),

  // Profile
  getMyProfile:   ()       => apiFetch('/users/me'),
  updateProfile:  (body)   => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  // Admin — User Management
  getAllUsers:     (params) => apiFetch(`/users?${new URLSearchParams(params)}`),
  getUserById:    (id)     => apiFetch(`/users/${id}`),
  updateUser:     (id, body) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deactivateUser: (id)     => apiFetch(`/users/${id}/deactivate`, { method: 'PATCH' }),
  deleteUser:     (id)     => apiFetch(`/users/${id}`, { method: 'DELETE' }),
  searchUsers:    (query)  => apiFetch(`/users/search?q=${encodeURIComponent(query)}`),
  // Books
  issueBookForUser:   (id, body)     => apiFetch(`/users/${id}/issue-book`, { method: 'POST', body: JSON.stringify(body) }),
  updateBookStatus:   (id, bookId, status) => apiFetch(`/users/${id}/books/${bookId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// --- Toast Notification ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', danger: '✕', warning: '!', info: 'i' };
  const colors = {
    success: 'rgba(52,211,153,0.12)',
    danger:  'rgba(248,113,113,0.12)',
    warning: 'rgba(251,191,36,0.12)',
    info:    'rgba(99,132,255,0.12)',
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = colors[type] || colors.info;
  toast.innerHTML = `<span style="font-size:1.1rem">${icons[type] || icons.info}</span>
    <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// --- Role Badge Helper ---
function roleBadge(role) {
  const map = {
    student: '<span class="badge badge-student">Student</span>',
    faculty: '<span class="badge badge-faculty">Faculty</span>',
    admin:   '<span class="badge badge-admin">Admin</span>',
  };
  return map[role] || `<span class="badge">${role}</span>`;
}

// --- Status Badge Helper ---
function statusBadge(isActive) {
  return isActive
    ? '<span class="badge badge-active">Active</span>'
    : '<span class="badge badge-inactive">Inactive</span>';
}

// --- Initials Helper ---
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// --- Populate Navbar User Info ---
function populateNavUser() {
  const user = Auth.getUser();
  if (!user) return;
  const el = document.getElementById('nav-user-name');
  const av = document.getElementById('nav-avatar');
  if (el) el.textContent = user.name;
  if (av) av.textContent = getInitials(user.name);
}
