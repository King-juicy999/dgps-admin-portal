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

// ─────────────────────────────────────────
// APPLICATIONS — API Integration
// ─────────────────────────────────────────

const API_BASE = 'https://dgps-website.onrender.com';
let currentFilter = 'all';
let allApplications = [];

// Fetch and render applications
async function loadApplications(filter = 'all') {
  currentFilter = filter;
  const url = filter === 'all'
    ? `${API_BASE}/api/admin/applications/`
    : `${API_BASE}/api/admin/applications/?status=${filter}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) throw new Error('API error');

    allApplications = json.data;
    renderApplicationsTable(allApplications);
    renderDashboardTable(allApplications.slice(0, 3));
    updateCounts(allApplications);
  } catch (err) {
    console.error('Failed to load applications:', err);
  }
}

async function loadPaymentStats() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/payment-stats/`);
    const json = await res.json();
    if (!json.success) return;

    const { total_amount, total_count } = json.data;

    // Format amount as ₦95,000
    const formatted = '₦' + total_amount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    // Update Payments Received stat card (second card)
    const statCards = document.querySelectorAll('#view-dashboard .stat-card');
    if (statCards[1]) {
      statCards[1].querySelector('.stat-value').textContent = total_count;
      statCards[1].querySelector('.stat-sub').textContent = formatted + ' total';
    }
  } catch (err) {
    console.error('Failed to load payment stats:', err);
  }
}

// Render the full applications table
function renderApplicationsTable(data) {
  const tbody = document.querySelector('#view-applications table tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(app => `
    <tr>
      <td><div class="t-name">${app.student}</div></td>
      <td class="t-sub">${app.class_name}</td>
      <td>${app.parent}</td>
      <td><span class="t-ref">${app.reference}</span></td>
      <td>${app.payment_status === 'paid' ? app.amount : '<span class="unpaid-text">Unpaid</span>'}</td>
      <td>
        <div class="action-row">
          <div class="act-btn" onclick="viewApplication(${app.id})" title="View full application">
            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          </div>
          <div class="act-btn danger" onclick="deleteApplication(${app.id}, this)" title="Delete application">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

// Render the dashboard recent applications table (top 3)
function renderDashboardTable(data) {
  const tbody = document.querySelector('#view-dashboard table tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">No applications yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(app => `
    <tr>
      <td><div class="t-name">${app.student}</div></td>
      <td class="t-sub">${app.class_name}</td>
      <td>${app.parent}</td>
      <td><span class="t-ref">${app.reference}</span></td>
      <td>
        <div class="action-row">
          <div class="act-btn" onclick="viewApplication(${app.id})">
            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          </div>
          <div class="act-btn danger" onclick="deleteApplication(${app.id}, this)">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

// Update pill counts and sidebar badge
function updateCounts(data) {
  const total = data.length;
  const paid = data.filter(a => a.payment_status === 'paid').length;
  const unpaid = total - paid;

  // Filter pills
  const pills = document.querySelectorAll('#view-applications .filter-pill');
  if (pills[0]) pills[0].textContent = `All (${total})`;
  if (pills[1]) pills[1].textContent = `Paid (${paid})`;
  if (pills[2]) pills[2].textContent = `Unpaid (${unpaid})`;

  // Sidebar badge
  const badge = document.querySelector('[data-view="applications"] .sb-badge');
  if (badge) badge.textContent = total;

  // Dashboard stat cards
  const statCards = document.querySelectorAll('#view-dashboard .stat-card');
  if (statCards[0]) statCards[0].querySelector('.stat-value').textContent = total;
  if (statCards[2]) statCards[2].querySelector('.stat-value').textContent = unpaid;
}

// Filter pill click handler
function setFilter(filter, pillEl) {
  document.querySelectorAll('#view-applications .filter-pill').forEach(p => p.classList.remove('active'));
  pillEl.classList.add('active');
  loadApplications(filter);
}

// View full application in modal
async function viewApplication(id) {
  const modal = document.getElementById('app-modal');
  const content = document.getElementById('app-modal-content');
  modal.style.display = 'flex';
  content.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">Loading...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/applications/${id}/`);
    const json = await res.json();

    if (!json.success) throw new Error('Not found');

    const d = json.data;
    content.innerHTML = `
      <h2 style="font-size:1.1rem; color:#0a7a24; margin-bottom:1.5rem; padding-bottom:0.75rem; border-bottom:2px solid #f0f0f0;">
        Full Application — ${d.full_name}
      </h2>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:#0a7a24; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Student</div>
        ${modalRow('Full name', d.full_name)}
        ${modalRow('Date of birth', d.date_of_birth)}
        ${modalRow('Age', d.age)}
        ${modalRow('Gender', d.gender)}
        ${modalRow('Nationality', d.nationality)}
        ${modalRow('Class applying for', d.class_name)}
        ${modalRow('Preferred contact', d.preferred_contact_method)}
      </div>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:#0a7a24; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Parent / Guardian</div>
        ${modalRow('Name', d.parent_name)}
        ${modalRow('Relationship', d.parent_relationship)}
        ${modalRow('Email', d.parent_email)}
        ${modalRow('Phone', d.parent_phone)}
        ${modalRow('Additional phone', d.parent_phone_2)}
        ${modalRow('Occupation', d.parent_occupation)}
        ${modalRow('Workplace', d.parent_workplace)}
        ${modalRow('Work address', d.parent_work_address)}
        ${modalRow('Home address', d.parent_home_address)}
      </div>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:#0a7a24; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Emergency Contact</div>
        ${modalRow('Name', d.emergency_contact_name)}
        ${modalRow('Phone', d.emergency_contact_phone)}
        ${modalRow('Relationship', d.emergency_contact_relationship)}
      </div>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:#0a7a24; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Medical</div>
        ${modalRow('Medical info / allergies', d.medical_information)}
      </div>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:#0a7a24; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Payment</div>
        ${modalRow('Reference', d.payment_reference)}
        ${modalRow('Amount paid', d.amount_paid)}
        ${modalRow('Payment status', d.payment_status)}
      </div>

      <div style="font-size:0.75rem; color:#999; text-align:right; margin-top:1rem;">
        Applied: ${d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) : '-'}
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<p style="text-align:center; padding:2rem; color:#ef4444;">Failed to load application. Please try again.</p>';
  }
}

function modalRow(label, value) {
  return `
    <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f3f3f3; font-size:0.875rem;">
      <span style="color:#777;">${label}</span>
      <span style="font-weight:500; color:#333; text-align:right; max-width:60%;">${value || '-'}</span>
    </div>
  `;
}

function closeAppModal() {
  document.getElementById('app-modal').style.display = 'none';
}

// Close modal on backdrop click
document.getElementById('app-modal').addEventListener('click', function(e) {
  if (e.target === this) closeAppModal();
});

// Soft delete application
async function deleteApplication(id, btnEl) {
  if (!confirm('Delete this application? This cannot be undone from the portal.')) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/applications/${id}/delete/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();

    if (json.success) {
      // Remove the row from the table
      const row = btnEl.closest('tr');
      if (row) row.remove();

      // Reload to update counts
      loadApplications(currentFilter);
    } else {
      alert('Delete failed. Please try again.');
    }
  } catch (err) {
    alert('Delete failed. Please try again.');
  }
}

// Auto-load applications when the Applications view is opened
const _originalNavTo = typeof navTo === 'function' ? navTo : null;
if (_originalNavTo) {
  window._navTo = navTo;
  navTo = function(view, el) {
    window._navTo(view, el);
    if (view === 'applications' || view === 'dashboard') {
      loadApplications(currentFilter);
    }
  };
}

// Load on page ready if already on applications or dashboard
document.addEventListener('DOMContentLoaded', function() {
  loadApplications();
  loadPaymentStats();
});
