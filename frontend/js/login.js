// login.js — Login Page Logic

// If already logged in, redirect
if (Auth.isLoggedIn()) {
  const user = Auth.getUser();
  window.location.href = user?.role === 'admin'
    ? '/admin/dashboard.html'
    : '/profile.html';
}

const form        = document.getElementById('login-form');
const loginBtn    = document.getElementById('login-btn');
const btnText     = document.getElementById('btn-text');
const btnSpinner  = document.getElementById('btn-spinner');
const alertBox    = document.getElementById('alert-box');
const togglePwd   = document.getElementById('toggle-password');
const pwdInput    = document.getElementById('password');

// Toggle password visibility
togglePwd.addEventListener('click', () => {
  const isHidden = pwdInput.type === 'password';
  pwdInput.type = isHidden ? 'text' : 'password';
  togglePwd.textContent = isHidden ? 'Hide' : 'Show';
});

// Show inline alert
function showAlert(message, type = 'danger') {
  alertBox.innerHTML = `<div class="alert alert-${type}"><span>${message}</span></div>`;
}
function clearAlert() { alertBox.innerHTML = ''; }

// Validate fields
function validate() {
  let valid = true;
  const userId = document.getElementById('userId').value.trim();
  const pwd   = pwdInput.value;

  const userIdErr = document.getElementById('userid-error');
  const pwdErr   = document.getElementById('password-error');

  if (!userId) {
    document.getElementById('userId').classList.add('is-invalid');
    userIdErr.classList.add('show');
    valid = false;
  } else {
    document.getElementById('userId').classList.remove('is-invalid');
    userIdErr.classList.remove('show');
  }

  if (!pwd) {
    pwdInput.classList.add('is-invalid');
    pwdErr.classList.add('show');
    valid = false;
  } else {
    pwdInput.classList.remove('is-invalid');
    pwdErr.classList.remove('show');
  }

  return valid;
}

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  if (!validate()) return;

  // Loading state
  btnText.textContent = 'Signing in...';
  btnSpinner.style.display = 'inline-block';
  loginBtn.disabled = true;

  const userId = document.getElementById('userId').value.trim();
  const password = pwdInput.value;
  const role = document.getElementById('role').value;

  const result = await API.login({ userId, password, role });

  btnText.textContent = 'Sign In';
  btnSpinner.style.display = 'none';
  loginBtn.disabled = false;

  if (!result.success) {
    showAlert(result.message || 'Invalid credentials. Please try again.');
    return;
  }

  // Save token and user
  Auth.setToken(result.data.token);
  Auth.setUser(result.data.user);

  showToast('Login successful! Redirecting...', 'success');

  setTimeout(() => {
    const role = result.data.user.role;
    if (role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else {
      window.location.href = '/profile.html';
    }
  }, 800);
});
