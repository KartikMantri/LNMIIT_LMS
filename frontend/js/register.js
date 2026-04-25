// register.js — Registration Page Logic

if (Auth.isLoggedIn()) window.location.href = '/profile.html';

const form       = document.getElementById('register-form');
const registerBtn = document.getElementById('register-btn');
const btnText    = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const alertBox   = document.getElementById('alert-box');
const roleSelect = document.getElementById('role');
const userIdGroup  = document.getElementById('userid-group');
const userIdLabel  = document.getElementById('userid-label');
const userIdInput  = document.getElementById('userId');
const userIdIcon   = document.getElementById('userid-icon');

// Show and configure User ID field based on role
roleSelect.addEventListener('change', () => {
  const role = roleSelect.value;
  userIdGroup.style.display = 'block';
  if (role === 'student') {
    userIdLabel.textContent = 'Roll Number';
    userIdInput.placeholder = 'e.g. 24UCS246';
    userIdIcon.textContent = '🎓';
  } else if (role === 'faculty') {
    userIdLabel.textContent = 'Faculty ID';
    userIdInput.placeholder = 'e.g. CS101';
    userIdIcon.textContent = '👨‍🏫';
  } else {
    userIdGroup.style.display = 'none';
  }
});

// Toggle password
document.getElementById('toggle-pwd').addEventListener('click', function () {
  const pwd = document.getElementById('password');
  const isHidden = pwd.type === 'password';
  pwd.type = isHidden ? 'text' : 'password';
  this.textContent = isHidden ? '🙈' : '👁️';
});

function showAlert(message, type = 'danger') {
  alertBox.innerHTML = `<div class="alert alert-${type}"><span>${message}</span></div>`;
}
function clearAlert() { alertBox.innerHTML = ''; }

function setError(id, show) {
  const el = document.getElementById(id);
  if (el) show ? el.classList.add('show') : el.classList.remove('show');
}

function validate() {
  let valid = true;
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const role     = roleSelect.value;
  const userId   = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirmPassword').value;

  setError('name-error',     !name);
  setError('email-error',    !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  setError('role-error',     !role);
  setError('userid-error',   (role === 'student' || role === 'faculty') && !userId);
  setError('password-error', !password || password.length < 6);
  setError('confirm-error',  !confirm || password !== confirm);

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role
    || ((role === 'student' || role === 'faculty') && !userId)
    || !password || password.length < 6
    || password !== confirm) {
    valid = false;
  }
  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  if (!validate()) return;

  btnText.textContent = 'Creating Account...';
  btnSpinner.style.display = 'inline-block';
  registerBtn.disabled = true;

  const body = {
    name:     document.getElementById('name').value.trim(),
    email:    document.getElementById('email').value.trim(),
    role:     roleSelect.value,
    password: document.getElementById('password').value,
    phone:    document.getElementById('phone').value.trim() || undefined,
    userId:   (roleSelect.value === 'student' || roleSelect.value === 'faculty')
              ? document.getElementById('userId').value.trim()
              : undefined,
  };

  const result = await API.register(body);

  btnText.textContent = 'Create Account';
  btnSpinner.style.display = 'none';
  registerBtn.disabled = false;

  if (!result.success) {
    showAlert(result.message || 'Registration failed. Please try again.');
    return;
  }

  Auth.setToken(result.data.token);
  Auth.setUser(result.data.user);

  showToast('Account created successfully!', 'success');
  setTimeout(() => { window.location.href = '/profile.html'; }, 900);
});
