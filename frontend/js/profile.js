// profile.js — Profile Page Logic

if (!Auth.require()) throw new Error('Not authenticated');

populateNavUser();

const alertBox  = document.getElementById('alert-box');
const editAlert = document.getElementById('edit-alert');

function showAlert(msg, type = 'danger') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

// Load and render profile
async function loadProfile() {
  const result = await API.getMyProfile();
  if (!result.success) {
    showAlert(result.message || 'Failed to load profile.');
    return;
  }

  const user = result.data.user || result.data;
  Auth.setUser(user); // keep local copy fresh
  populateNavUser();

  // View panel
  document.getElementById('profile-name').textContent  = user.name || '—';
  document.getElementById('profile-role').innerHTML    = roleBadge(user.role);
  document.getElementById('profile-status').innerHTML  = statusBadge(user.isActive);
  document.getElementById('profile-avatar').textContent = getInitials(user.name);

  document.getElementById('info-email').textContent   = user.email   || '—';
  document.getElementById('info-phone').textContent   = user.phone   || '—';
  document.getElementById('info-address').textContent = user.address || '—';
  document.getElementById('info-since').textContent   = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    : '—';

  if (user.role === 'student' || user.role === 'faculty') {
    document.getElementById('info-userid-label').textContent = user.role === 'student' ? 'Roll No.' : 'Faculty ID';
    document.getElementById('info-userid').textContent = user.userId || '—';
    document.getElementById('userid-row').style.display = 'flex';
    
    document.getElementById('edit-userid-label').textContent = user.role === 'student' ? 'Roll Number' : 'Faculty ID';
    document.getElementById('edit-userid-group').style.display = 'block';

    // Show Issued Books section
    const issuedSection = document.getElementById('issued-books-section');
    if (issuedSection) {
      issuedSection.style.display = 'block';
      const tbody = document.getElementById('issued-books-body');
      const noBooksMsg = document.getElementById('no-books-msg');
      const table = document.getElementById('issued-books-table');
      
      tbody.innerHTML = '';
      
      if (!user.issuedBooks || user.issuedBooks.length === 0) {
        noBooksMsg.style.display = 'block';
        table.style.display = 'none';
      } else {
        noBooksMsg.style.display = 'none';
        table.style.display = 'table';
        
        user.issuedBooks.forEach(book => {
          let badgeClass = 'background: var(--muted); color: var(--muted-foreground);';
          if (book.status === 'returned') badgeClass = 'background: #dcfce7; color: #166534;';
          if (book.status === 'pending') badgeClass = 'background: #fef9c3; color: #854d0e;';
          if (book.status === 'late fees required') badgeClass = 'background: #fee2e2; color: #991b1b;';
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${book.bookTitle}</strong></td>
            <td>${new Date(book.issueDate).toLocaleDateString()}</td>
            <td>${new Date(book.returnDate).toLocaleDateString()}</td>
            <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; ${badgeClass}">${book.status.toUpperCase()}</span></td>
          `;
          tbody.appendChild(row);
        });
      }
    }

  } else {
    document.getElementById('userid-row').style.display = 'none';
    document.getElementById('edit-userid-group').style.display = 'none';
    const issuedSection = document.getElementById('issued-books-section');
    if (issuedSection) issuedSection.style.display = 'none';
  }

  // Pre-fill edit form
  document.getElementById('edit-name').value    = user.name    || '';
  document.getElementById('edit-phone').value   = user.phone   || '';
  document.getElementById('edit-address').value = user.address || '';
  document.getElementById('edit-userid').value  = user.userId  || '';
}

loadProfile();

// Edit form submit
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  editAlert.innerHTML = '';

  const name = document.getElementById('edit-name').value.trim();
  if (!name) {
    document.getElementById('edit-name-error').classList.add('show');
    return;
  }
  document.getElementById('edit-name-error').classList.remove('show');

  const saveBtn     = document.getElementById('save-btn');
  const saveText    = document.getElementById('save-text');
  const saveSpinner = document.getElementById('save-spinner');
  saveBtn.disabled = true;
  saveText.textContent = 'Saving...';
  saveSpinner.style.display = 'inline-block';

  const body = {
    name,
    phone:   document.getElementById('edit-phone').value.trim()   || undefined,
    address: document.getElementById('edit-address').value.trim() || undefined,
    userId:  document.getElementById('edit-userid').value.trim()  || undefined,
  };

  const result = await API.updateProfile(body);

  saveBtn.disabled = false;
  saveText.textContent = 'Save Changes';
  saveSpinner.style.display = 'none';

  if (!result.success) {
    editAlert.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
    return;
  }

  Auth.setUser(result.data.user || result.data);
  showToast('Profile updated successfully!', 'success');
  loadProfile();
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  Auth.logout();
});
