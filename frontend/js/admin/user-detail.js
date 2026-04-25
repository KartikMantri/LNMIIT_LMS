// admin/user-detail.js — Admin User Detail Page Logic

if (!Auth.requireAdmin()) throw new Error('Not authorized');
populateNavUser();

const currentUser = Auth.getUser();
document.getElementById('sidebar-user-name').textContent = currentUser?.name || 'Admin';
document.getElementById('nav-avatar').textContent = getInitials(currentUser?.name || 'A');

document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

if (!userId) {
  window.location.href = 'users';
}

const loader = document.getElementById('loader');
const contentArea = document.getElementById('content-area');
const alertBox = document.getElementById('alert-box');

function showAlert(msg, type = 'danger') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

let targetUser = null;

async function loadUserDetails() {
  const result = await API.getUserById(userId);

  if (!result.success) {
    loader.style.display = 'none';
    showAlert(result.message || 'User not found.');
    return;
  }

  targetUser = result.data.user || result.data;

  loader.style.display = 'none';
  contentArea.style.display = 'grid';

  // Populate view
  document.getElementById('user-name').textContent = targetUser.name;
  document.getElementById('user-email').textContent = targetUser.email;
  document.getElementById('user-avatar').textContent = getInitials(targetUser.name);
  
  document.getElementById('user-badges').innerHTML = `
    ${roleBadge(targetUser.role)}
    ${statusBadge(targetUser.isActive)}
  `;

  document.getElementById('info-id').textContent = targetUser._id;
  document.getElementById('info-phone').textContent = targetUser.phone || '-';
  document.getElementById('info-address').textContent = targetUser.address || '-';
  document.getElementById('info-joined').textContent = new Date(targetUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  if (targetUser.role === 'student' || targetUser.role === 'faculty') {
    document.getElementById('info-userid-label').textContent = targetUser.role === 'student' ? 'Roll No.' : 'Faculty ID';
    document.getElementById('info-userid').textContent = targetUser.userId || '-';
    document.getElementById('userid-row').style.display = 'flex';
  } else {
    document.getElementById('userid-row').style.display = 'none';
  }

  // Populate form
  document.getElementById('edit-name').value = targetUser.name;
  document.getElementById('edit-role').value = targetUser.role;
  document.getElementById('edit-status').value = targetUser.isActive.toString();
  document.getElementById('edit-phone').value = targetUser.phone || '';
  document.getElementById('edit-address').value = targetUser.address || '';

  // Prevent admin from deleting themselves
  if (targetUser._id === currentUser._id) {
    const delBtn = document.getElementById('delete-btn');
    delBtn.disabled = true;
    delBtn.title = "You cannot delete your own account.";
  }

  // Show issued books section for student/faculty
  renderIssuedBooks(targetUser);
}

function renderIssuedBooks(user) {
  const section = document.getElementById('issued-books-section');
  if (user.role === 'admin') {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  const limit = user.role === 'student' ? 3 : 5;
  const activeCount = (user.issuedBooks || []).filter(b => b.status !== 'returned').length;
  document.getElementById('book-limit-badge').textContent = `${activeCount} / ${limit} books active`;

  const tbody = document.getElementById('issued-books-body');
  const noMsg = document.getElementById('no-books-msg');
  const table = document.getElementById('issued-books-table');

  tbody.innerHTML = '';

  if (!user.issuedBooks || user.issuedBooks.length === 0) {
    noMsg.style.display = 'block';
    table.style.display = 'none';
  } else {
    noMsg.style.display = 'none';
    table.style.display = 'table';

    user.issuedBooks.forEach((book, i) => {
      let badge = '';
      if (book.status === 'returned')           badge = 'background:#dcfce7;color:#166534;';
      else if (book.status === 'pending')        badge = 'background:#fef9c3;color:#854d0e;';
      else if (book.status === 'late fees required') badge = 'background:#fee2e2;color:#991b1b;';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';
      tr.innerHTML = `
        <td style="padding:12px;color:var(--muted-foreground);font-size:0.82rem;">${i + 1}</td>
        <td style="padding:12px;font-weight:500;">${book.bookTitle}</td>
        <td style="padding:12px;color:var(--muted-foreground);">${new Date(book.issueDate).toLocaleDateString('en-IN')}</td>
        <td style="padding:12px;color:var(--muted-foreground);">${new Date(book.returnDate).toLocaleDateString('en-IN')}</td>
        <td style="padding:12px;">
          <select class="form-control" style="height:32px; font-size:0.8rem; padding:4px 8px; width:auto; ${badge}" onchange="updateBookStatus('${book._id}', this.value)">
            <option value="pending" ${book.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="returned" ${book.status === 'returned' ? 'selected' : ''}>Returned</option>
            <option value="late fees required" ${book.status === 'late fees required' ? 'selected' : ''}>Late Fees</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.updateBookStatus = async (bookId, newStatus) => {
  const result = await API.updateBookStatus(userId, bookId, newStatus);
  if (!result.success) {
    showToast(result.message || 'Failed to update book status', 'danger');
    return;
  }
  showToast('Book status updated successfully', 'success');
  loadUserDetails(); // Reloads table and active count
};

loadUserDetails();

// Edit form submit
document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';

  const name = document.getElementById('edit-name').value.trim();
  if (!name) {
    document.getElementById('edit-name-error').classList.add('show');
    return;
  }
  document.getElementById('edit-name-error').classList.remove('show');

  const saveBtn = document.getElementById('save-btn');
  const saveText = document.getElementById('save-text');
  const spinner = document.getElementById('save-spinner');

  saveBtn.disabled = true;
  saveText.textContent = 'Updating...';
  spinner.style.display = 'inline-block';

  // Role changes are allowed here
  const body = {
    name,
    role: document.getElementById('edit-role').value,
    phone: document.getElementById('edit-phone').value.trim() || undefined,
    address: document.getElementById('edit-address').value.trim() || undefined,
  };

  // Status (isActive) can only be changed via update for admin or deactivate route
  // For simplicity, we send isActive in PUT
  body.isActive = document.getElementById('edit-status').value === 'true';

  const result = await API.updateUser(userId, body);

  saveBtn.disabled = false;
  saveText.textContent = 'Update User';
  spinner.style.display = 'none';

  if (!result.success) {
    showAlert(result.message || 'Failed to update user.');
    return;
  }

  showToast('User updated successfully', 'success');
  loadUserDetails();
});

// Delete user
document.getElementById('delete-btn').addEventListener('click', async () => {
  if (targetUser._id === currentUser._id) return;

  if (confirm(`Are you sure you want to permanently delete ${targetUser.name}?`)) {
    const btn = document.getElementById('delete-btn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    const result = await API.deleteUser(userId);

    if (!result.success) {
      btn.disabled = false;
      btn.textContent = 'Delete';
      showAlert(result.message || 'Failed to delete user.');
      return;
    }

    showToast('User deleted successfully', 'success');
    setTimeout(() => {
      window.location.href = 'users';
    }, 1000);
  }
});

// Admin Issue Book Form
document.getElementById('admin-issue-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title      = document.getElementById('admin-issue-title').value.trim();
  const returnDate = document.getElementById('admin-issue-return').value;
  const status     = document.getElementById('admin-issue-status').value;

  if (!title || !returnDate) {
    showToast('Please fill in Book Title and Return Date', 'danger');
    return;
  }

  const issueBtn = document.getElementById('admin-issue-btn');
  issueBtn.disabled = true;
  issueBtn.textContent = 'Issuing...';

  const result = await API.issueBookForUser(userId, { bookTitle: title, returnDate, status });

  issueBtn.disabled = false;
  issueBtn.textContent = '📗 Issue Book';

  if (!result.success) {
    showToast(result.message, 'danger');
    return;
  }

  showToast(result.data.message || 'Book issued successfully!', 'success');
  document.getElementById('admin-issue-form').reset();
  loadUserDetails(); // Reload to update table and badge count
});
