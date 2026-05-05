// admin/dashboard.js — Admin Dashboard Logic

if (!Auth.requireAdmin()) throw new Error('Not authorized');

populateNavUser();

const user = Auth.getUser();
document.getElementById('sidebar-user-name').textContent = user?.name || 'Admin';
document.getElementById('nav-avatar').textContent = getInitials(user?.name || 'A');

// Greeting
const hour = new Date().getHours();
const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
document.getElementById('greeting').textContent = `${greet}, ${user?.name?.split(' ')[0] || 'Admin'}`;

// Logout
document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

// Load stats and recent users
async function loadDashboard() {
  const result = await API.getAllUsers({ limit: 10, sort: '-createdAt' });

  const loader = document.getElementById('table-loader');
  const table  = document.getElementById('recent-table');

  if (!result.success) {
    loader.innerHTML = `<div class="alert alert-danger" style="margin:20px;">${result.message}</div>`;
    return;
  }

  const users = result.data.users || result.data;
  const total = result.data.total ?? users.length;

  // Compute stats
  const students = users.filter(u => u.role === 'student').length;
  const faculty  = users.filter(u => u.role === 'faculty').length;
  const active   = users.filter(u => u.isActive).length;

  // For accurate counts, use meta from API if available
  document.getElementById('stat-total').textContent    = result.data.total    ?? total;
  document.getElementById('stat-students').textContent = result.data.students ?? students;
  document.getElementById('stat-faculty').textContent  = result.data.faculty  ?? faculty;
  document.getElementById('stat-active').textContent   = result.data.active   ?? active;

  // Animate stat numbers
  document.querySelectorAll('.stat-value').forEach(el => {
    const target = parseInt(el.textContent) || 0;
    let cur = 0;
    const step = Math.ceil(target / 20);
    const interval = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(interval);
    }, 40);
  });

  // Populate table
  if (!users.length) {
    loader.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><p>No users registered yet.</p></div>`;
    return;
  }

  loader.style.display = 'none';
  table.style.display  = 'table';

  const tbody = document.getElementById('recent-tbody');
  tbody.innerHTML = users.slice(0, 8).map((u, i) => `
    <tr>
      <td style="color:var(--text-muted);">${i + 1}</td>
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
      <td>${statusBadge(u.isActive)}</td>
      <td style="color:var(--text-muted);font-size:0.8rem;">
        ${new Date(u.createdAt).toLocaleDateString('en-IN')}
      </td>
      <td>
        <a href="user-detail.html?id=${u._id}" class="btn btn-secondary btn-sm">View</a>
      </td>
    </tr>
  `).join('');
}

loadDashboard();
