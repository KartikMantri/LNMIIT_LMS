// admin/users.js — Admin Users Page Logic

if (!Auth.requireAdmin()) throw new Error('Not authorized');
populateNavUser();

const currentUser = Auth.getUser();
document.getElementById('sidebar-user-name').textContent = currentUser?.name || 'Admin';
document.getElementById('nav-avatar').textContent = getInitials(currentUser?.name || 'A');

document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

// State
let currentPage = 1;
const limit = 10;
let currentSearch = '';
let currentRole = new URLSearchParams(window.location.search).get('role') || '';
let currentStatus = '';

// Elements
const searchInput = document.getElementById('search-input');
const filterRole = document.getElementById('filter-role');
const filterStatus = document.getElementById('filter-status');
const tbody = document.getElementById('users-tbody');
const loader = document.getElementById('table-loader');
const table = document.getElementById('users-table');
const paginationInfo = document.getElementById('pagination-info');
const paginationEl = document.getElementById('pagination');

// Initialization
if (currentRole) {
  filterRole.value = currentRole;
  if (currentRole === 'student') document.getElementById('link-students')?.classList.add('active');
  if (currentRole === 'faculty') document.getElementById('link-faculty')?.classList.add('active');
  document.querySelector('.sidebar-item[href="users"]')?.classList.remove('active');
}

// Event Listeners
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadUsers();
  }, 400);
});

filterRole.addEventListener('change', (e) => {
  currentRole = e.target.value;
  currentPage = 1;
  loadUsers();
});

filterStatus.addEventListener('change', (e) => {
  currentStatus = e.target.value;
  currentPage = 1;
  loadUsers();
});

// Load Users
async function loadUsers() {
  loader.style.display = 'block';
  table.style.display = 'none';

  let result;
  if (currentSearch) {
    result = await API.searchUsers(currentSearch);
  } else {
    const params = { page: currentPage, limit, sort: '-createdAt' };
    if (currentRole) params.role = currentRole;
    if (currentStatus !== '') params.isActive = currentStatus;
    result = await API.getAllUsers(params);
  }

  loader.style.display = 'none';

  if (!result.success) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--danger);">${result.message}</td></tr>`;
    table.style.display = 'table';
    return;
  }

  const users = result.data.users || result.data || [];
  const total = result.data.total ?? users.length;

  if (users.length === 0) {
    table.style.display = 'none';
    loader.style.display = 'block';
    loader.innerHTML = `<div class="empty-icon"></div><p>No users found matching your criteria.</p>`;
    paginationInfo.textContent = 'Showing 0 of 0 users';
    paginationEl.innerHTML = '';
    return;
  }

  table.style.display = 'table';
  
  // Render rows
  tbody.innerHTML = users.map((u, i) => {
    const offset = (currentPage - 1) * limit;
    return `
      <tr>
        <td style="color:var(--text-muted);">${offset + i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar" style="width:32px;height:32px;font-size:0.75rem;cursor:default;">
              ${getInitials(u.name)}
            </div>
            <div style="font-weight:500;">${u.name}</div>
          </div>
        </td>
        <td style="color:var(--text-secondary);">${u.email}</td>
        <td>${roleBadge(u.role)}</td>
        <td style="color:var(--text-secondary);">${u.userId || '-'}</td>
        <td>${statusBadge(u.isActive)}</td>
        <td style="color:var(--text-muted);font-size:0.8rem;">
          ${new Date(u.createdAt).toLocaleDateString('en-IN')}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="user-detail?id=${u._id}" class="btn btn-secondary btn-sm" title="View details">View</a>
            <button class="btn btn-danger btn-sm" title="Delete user" onclick="openDeleteModal('${u._id}', '${u.name}', '${u.role}')" ${u.role === 'admin' ? 'disabled' : ''}>Del</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Pagination
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(start + limit - 1, total);
  paginationInfo.textContent = `Showing ${start}-${end} of ${total} users`;

  const totalPages = Math.ceil(total / limit) || 1;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (currentSearch || totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="color:var(--text-muted);padding:0 4px;">...</span>`;
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>`;
  paginationEl.innerHTML = html;
}

window.changePage = (p) => {
  currentPage = p;
  loadUsers();
};

// Delete Modal Logic
const deleteModal = document.getElementById('delete-modal');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-delete');
const confirmBtn = document.getElementById('confirm-delete');
let userToDelete = null;

window.openDeleteModal = (id, name, role) => {
  if (role === 'admin') return; // Safety
  userToDelete = id;
  document.getElementById('delete-user-name').textContent = name;
  deleteModal.style.display = 'flex';
};

const closeModal = () => {
  deleteModal.style.display = 'none';
  userToDelete = null;
};

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

confirmBtn.addEventListener('click', async () => {
  if (!userToDelete) return;

  const btnText = document.getElementById('del-text');
  const spinner = document.getElementById('del-spinner');
  confirmBtn.disabled = true;
  btnText.textContent = 'Deleting...';
  spinner.style.display = 'inline-block';

  const result = await API.deleteUser(userToDelete);

  confirmBtn.disabled = false;
  btnText.textContent = 'Delete';
  spinner.style.display = 'none';
  closeModal();

  if (!result.success) {
    showToast(result.message || 'Failed to delete user', 'danger');
    return;
  }

  showToast('User deleted successfully', 'success');
  loadUsers();
});

// Init
loadUsers();
