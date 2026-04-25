/* ══════════════════════════════
   DGPS ADMIN PORTAL — JS
══════════════════════════════ */

/* ── MOCK AUTH ── */
const MOCK_USERS = [
  { email: 'william@dgpschools.com', password: 'admin2025', role: 'super', name: 'William A.' },
  { email: 'secretary@dgpschools.com', password: 'admin2025', role: 'admin', name: 'Mrs. Adebayo' },
  { email: 'principal@dgpschools.com', password: 'admin2025', role: 'admin', name: 'Mr. Taiwo' }
];

let currentUser = null;

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (!user) {
    errorEl.textContent = 'Incorrect email or password. Please try again.';
    return;
  }
  errorEl.textContent = '';
  currentUser = user;
  applyRole(user);
  showPage('portal');
}

function doLogout() {
  currentUser = null;
  showPage('login');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function applyRole(user) {
  document.getElementById('sb-username').textContent = user.name;
  document.getElementById('sb-urole').textContent = user.role === 'super' ? 'Super Admin' : 'Admin';
  document.getElementById('sb-role-label').textContent = user.role === 'super' ? 'Super Admin' : 'Admin';
  document.getElementById('sb-avatar').textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const superItems = document.querySelectorAll('.super-only');
  superItems.forEach(el => {
    el.style.display = user.role === 'super' ? '' : 'none';
  });
}

/* ── PAGE SWITCH ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
}

/* ── NAVIGATION ── */
function navTo(viewId, triggerEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
  if (triggerEl && triggerEl.classList.contains('sb-btn')) {
    triggerEl.classList.add('active');
  } else {
    const match = document.querySelector(`.sb-btn[data-view="${viewId}"]`);
    if (match) match.classList.add('active');
  }

  document.querySelectorAll('.mob-tab').forEach(b => b.classList.remove('active'));
  const mobMatch = document.querySelector(`.mob-tab[data-view="${viewId}"]`);
  if (mobMatch) mobMatch.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    applications: 'Applications',
    payments: 'Payments',
    ai: 'DGPS AI assistant',
    announcements: 'Announcements',
    calendar: 'Calendar',
    'manage-admins': 'Manage admins',
    'activity-log': 'Activity log'
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[viewId] || viewId;

  closeSidebar();
}

/* ── MOBILE SIDEBAR ── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('open');
}

/* ── AI ASSISTANT ── */
function toggleRcptTab(el, mode) {
  document.querySelectorAll('.ai-rcpt-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('rcpt-specific').style.display = mode === 'specific' ? '' : 'none';
  document.getElementById('rcpt-all').style.display = mode === 'all' ? '' : 'none';
}

function toggleChannel(el) {
  el.classList.toggle('active');
}

function removeChip(svgEl) {
  svgEl.closest('.ai-chip').remove();
}

function addRecipient(name, contact) {
  const chips = document.getElementById('ai-chips');
  const chip = document.createElement('div');
  chip.className = 'ai-chip';
  chip.innerHTML = `${name} <svg onclick="removeChip(this)" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  chips.appendChild(chip);
  document.querySelector('.ai-search-input').value = '';
}

function filterRecipients(val) {
  const items = document.querySelectorAll('.ai-dropdown-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(val.toLowerCase()) ? '' : 'none';
  });
}

/* ── ENTER KEY ON LOGIN ── */
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('login-password');
  if (pwInput) {
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }
});
