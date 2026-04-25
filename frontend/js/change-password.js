// change-password.js — Change Password Page Logic

if (!Auth.require()) throw new Error('Not authenticated');
populateNavUser();

document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

// Toggle eye icons
document.querySelectorAll('.toggle-eye').forEach(btn => {
  btn.addEventListener('click', function () {
    const target = document.getElementById(this.dataset.target);
    const isHidden = target.type === 'password';
    target.type = isHidden ? 'text' : 'password';
    this.textContent = isHidden ? '🙈' : '👁️';
  });
});

// Password strength checker
const newPwdInput = document.getElementById('new-password');
const strengthBar = document.getElementById('strength-bar');
const strengthLabel = document.getElementById('strength-label');
const strengthWrapper = document.getElementById('strength-bar-wrapper');

const reqLen   = document.getElementById('req-len');
const reqUpper = document.getElementById('req-upper');
const reqNum   = document.getElementById('req-num');

newPwdInput.addEventListener('input', () => {
  const val = newPwdInput.value;
  strengthWrapper.style.display = val ? 'block' : 'none';

  const hasLen   = val.length >= 6;
  const hasUpper = /[A-Z]/.test(val);
  const hasNum   = /[0-9]/.test(val);

  // Tick requirements
  reqLen.style.color   = hasLen   ? 'var(--success)' : 'var(--text-muted)';
  reqUpper.style.color = hasUpper ? 'var(--success)' : 'var(--text-muted)';
  reqNum.style.color   = hasNum   ? 'var(--success)' : 'var(--text-muted)';

  const score = [hasLen, hasUpper, hasNum].filter(Boolean).length;
  const map = {
    0: { w: '0%',   color: 'transparent',       label: '' },
    1: { w: '33%',  color: 'var(--danger)',      label: 'Weak' },
    2: { w: '66%',  color: 'var(--warning)',     label: 'Fair' },
    3: { w: '100%', color: 'var(--success)',     label: 'Strong 💪' },
  };
  strengthBar.style.width           = map[score].w;
  strengthBar.style.background      = map[score].color;
  strengthLabel.textContent         = map[score].label;
  strengthLabel.style.color         = map[score].color;
});

// Validation
function setError(id, show) {
  const el = document.getElementById(id);
  if (el) show ? el.classList.add('show') : el.classList.remove('show');
}

function validate() {
  const cur  = document.getElementById('current-password').value;
  const nw   = newPwdInput.value;
  const conf = document.getElementById('confirm-password').value;

  let valid = true;
  if (!cur)              { setError('cur-pwd-error',    true);  valid = false; } else setError('cur-pwd-error', false);
  if (!nw || nw.length < 6) { setError('new-pwd-error', true);  valid = false; } else setError('new-pwd-error', false);
  if (!conf || nw !== conf)  { setError('confirm-pwd-error', true); valid = false; } else setError('confirm-pwd-error', false);

  return valid;
}

// Form submit
document.getElementById('change-pwd-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('alert-box').innerHTML = '';
  if (!validate()) return;

  const btn     = document.getElementById('change-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('btn-spinner');

  btn.disabled = true;
  btnText.textContent = 'Updating...';
  spinner.style.display = 'inline-block';

  const result = await API.changePassword({
    currentPassword: document.getElementById('current-password').value,
    newPassword:     newPwdInput.value,
  });

  btn.disabled = false;
  btnText.textContent = 'Update Password';
  spinner.style.display = 'none';

  if (!result.success) {
    document.getElementById('alert-box').innerHTML =
      `<div class="alert alert-danger">${result.message}</div>`;
    return;
  }

  document.getElementById('change-pwd-form').reset();
  strengthWrapper.style.display = 'none';
  [reqLen, reqUpper, reqNum].forEach(r => r.style.color = 'var(--text-muted)');

  showToast('Password updated successfully!', 'success');
  document.getElementById('alert-box').innerHTML =
    `<div class="alert alert-success">✅ Password changed successfully!</div>`;
});
