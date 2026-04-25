// theme.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'theme-toggle-btn';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.width = '45px';
  btn.style.height = '45px';
  btn.style.borderRadius = '50%';
  btn.style.border = 'none';
  btn.style.backgroundColor = 'var(--card)';
  btn.style.color = 'var(--foreground)';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  btn.style.cursor = 'pointer';
  btn.style.zIndex = '9999';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.fontSize = '1.2rem';
  btn.style.transition = 'all 0.3s ease';
  
  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';

  document.body.appendChild(btn);

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      btn.innerHTML = '🌙';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      btn.innerHTML = '☀️';
    }
    localStorage.setItem('theme', theme);
  }

  // Initialize
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Default based on OS
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(isDark ? 'dark' : 'light');
  }

  btn.addEventListener('click', () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    applyTheme(isCurrentlyDark ? 'light' : 'dark');
  });
});
