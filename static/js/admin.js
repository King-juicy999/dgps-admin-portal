const GOOGLE_CLIENT_ID = '802466171345-er0f9b8hdt95j0bi9a8a9rcs3fsv5gk0.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
let googleAccessToken = null;
let selectedApplicationIds = new Set();

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
    ai: 'Assistant',
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
let allParents = [];

async function loadParents() {
  try {
    const res = await fetch('https://dgps-website.onrender.com/api/admin/parents/');
    const data = await res.json();
    if (data.success) {
      allParents = data.parents;
      const notice = document.getElementById('ai-all-notice');
      if (notice) notice.textContent = `Message will be sent to all ${data.parents.length} parents in the database.`;
    }
  } catch (e) {
    console.warn('Could not load parents:', e);
  }
}

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

function filterRecipients(query) {
  const dropdown = document.getElementById('ai-dropdown');
  if (!dropdown) return;
  const q = query.trim().toLowerCase();
  if (!q) { dropdown.style.display = 'none'; return; }

  const matches = allParents.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.email.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    (p.phone_2 && p.phone_2.includes(q))
  );

  dropdown.innerHTML = '';
  if (matches.length === 0) {
    dropdown.innerHTML = '<div class="ai-dropdown-add"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> No match — add manually</div>';
  } else {
    matches.slice(0, 6).forEach(p => {
      const initials = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const phones = [p.phone, p.phone_2].filter(Boolean).join(' · ');
      const item = document.createElement('div');
      item.className = 'ai-dropdown-item';
      item.innerHTML = `<div class="ai-rcpt-av">${initials}</div><div><div class="ai-rcpt-name">${p.name}</div><div class="ai-rcpt-contact">${p.email}${phones ? ' · ' + phones : ''}</div></div>`;
      item.onclick = () => addRecipient(p.name, p.email);
      dropdown.appendChild(item);
    });
    const addRow = document.createElement('div');
    addRow.className = 'ai-dropdown-add';
    addRow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add email or phone not in database';
    dropdown.appendChild(addRow);
  }
  dropdown.style.display = 'block';
}

function newMessage() {
  document.getElementById('ai-compose-panel').style.display = 'flex';
  document.getElementById('ai-empty-panel').style.display = 'none';
  document.getElementById('compose-subject').value = '';
  document.getElementById('compose-body').value = '';
  document.getElementById('ai-chips').innerHTML = '';
  document.getElementById('ai-dropdown').style.display = 'none';
  document.getElementById('ai-compose-title').textContent = 'New message';
  const tabs = document.querySelectorAll('.ai-rcpt-tab');
  tabs.forEach(t => t.classList.remove('active'));
  tabs[1].classList.add('active');
  document.getElementById('rcpt-specific').style.display = 'block';
  document.getElementById('rcpt-all').style.display = 'none';
}

function saveDraft() {
  const subject = document.getElementById('compose-subject').value.trim();
  if (!subject) { alert('Please enter a subject before saving.'); return; }
  alert('Draft saved.');
}

function sendMessage() {
  const subject = document.getElementById('compose-subject').value.trim();
  const body = document.getElementById('compose-body').value.trim();
  if (!subject || !body) { alert('Please fill in both subject and message before sending.'); return; }
  alert('Send functionality coming soon.');
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

    const amountEl = document.getElementById('stat-amount');
    if (amountEl) amountEl.textContent = formatted + ' total';
  } catch (err) {
    console.error('Failed to load payment stats:', err);
  }
}

async function loadPayments() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/payments/`);
    const json = await res.json();
    if (!json.success) return;

    const { data, meta } = json;

    // Update stat cards
    const totalEl = document.querySelector('#view-payments .stat-card:nth-child(1) .stat-value');
    const totalSubEl = document.querySelector('#view-payments .stat-card:nth-child(1) .stat-sub');
    const lastEl = document.querySelector('#view-payments .stat-card:nth-child(3) .stat-value');
    const lastSubEl = document.querySelector('#view-payments .stat-card:nth-child(3) .stat-sub');

    if (totalEl) totalEl.textContent = meta.total_collected_display;
    if (totalSubEl) totalSubEl.textContent = `${meta.total_count} payment${meta.total_count !== 1 ? 's' : ''}`;
    if (lastEl) lastEl.textContent = meta.last_payment || '—';
    if (lastSubEl) lastSubEl.textContent = 'most recent';

    // Outstanding — reuse allApplications if already loaded
    const outstandingEl = document.querySelector('#view-payments .stat-card:nth-child(2) .stat-value');
    if (outstandingEl && allApplications.length > 0) {
      const unpaid = allApplications.filter(a => a.payment_status !== 'paid').length;
      outstandingEl.textContent = unpaid;
    }

    // Render table
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No payments yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><div class="t-name">${p.student_name}</div></td>
        <td>${p.parent_name}</td>
        <td><span class="t-ref">${p.reference}</span></td>
        <td>${p.amount_display}</td>
        <td class="t-sub">${p.payment_date}</td>
        <td><span class="role-badge super" style="font-size:10px;">Paid</span></td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Failed to load payments:', err);
  }
}

// Render the full applications table
function renderApplicationsTable(data) {
  const tbody = document.querySelector('#view-applications table tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#999;">No applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(app => `
    <tr>
      <td class="row-check" data-label="Select">
        <input type="checkbox" class="app-checkbox" data-id="${app.id}"
          style="accent-color:#0a7a24; width:15px; height:15px; cursor:pointer;"
          ${selectedApplicationIds.has(app.id) ? 'checked' : ''}
          onchange="toggleAppSelection(${app.id}, this.checked)">
      </td>
      <td data-label="Student"><div class="t-name">${app.student}</div></td>
      <td class="t-sub" data-label="Class">${app.class_name}</td>
      <td data-label="Parent">${app.parent}</td>
      <td data-label="Reference"><span class="t-ref">${app.reference}</span></td>
      <td data-label="Amount">${app.payment_status === 'paid' ? app.amount : '<span class="unpaid-text">Unpaid</span>'}</td>
      <td data-label="Actions">
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
  syncSelectAllApplications();
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

  // Dashboard stat cards — use IDs now
  const statTotal = document.getElementById('stat-total');
  const statPaid = document.getElementById('stat-paid');
  const statUnpaid = document.getElementById('stat-unpaid');
  if (statTotal) statTotal.textContent = total;
  if (statPaid) statPaid.textContent = paid;
  if (statUnpaid) statUnpaid.textContent = unpaid;

  // Calculate how many applications came in this week (Sunday to now)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeek = data.filter(a => new Date(a.created_at) >= startOfWeek).length;

  const appStatSub = document.querySelector('#view-dashboard .stats-grid .stat-card:first-child .stat-sub');
  if (appStatSub) appStatSub.textContent = thisWeek > 0 ? `+${thisWeek} this week` : 'None this week';
}

// Filter pill click handler
function setFilter(filter, pillEl) {
  document.querySelectorAll('#view-applications .filter-pill').forEach(p => p.classList.remove('active'));
  pillEl.classList.add('active');
  loadApplications(filter);
}

function searchApplications(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderApplicationsTable(allApplications);
    return;
  }
  const filtered = allApplications.filter(a =>
    (a.student || '').toLowerCase().includes(q) ||
    (a.parent || '').toLowerCase().includes(q) ||
    (a.reference || '').toLowerCase().includes(q)
  );
  renderApplicationsTable(filtered);
}

function toggleExportDropdown() {
  const table = document.getElementById('applications-table');
  if (table) table.classList.toggle('export-mode');

  let dropdown = document.getElementById('export-dropdown');
  if (dropdown) {
    if (table) table.classList.remove('export-mode');
    dropdown.remove();
    return;
  }
  const btn = document.querySelector('#view-applications .btn-outline');
  dropdown = document.createElement('div');
  dropdown.id = 'export-dropdown';
  dropdown.style.cssText = `
    position:absolute; background:#fff; border:1px solid #e0e0e0;
    border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.12);
    top:100%; z-index:999; min-width:260px; overflow:visible;
  `;
  dropdown.innerHTML = `
    <div onclick="openSelectExportModal()" style="padding:12px 16px 8px; cursor:pointer; font-size:0.875rem; color:#0d1a0f; border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background='#f0faf2'" onmouseout="this.style.background=''">
      Export selected applications
    </div>
    <div onclick="exportData('all', 'xlsx')" style="padding:12px 16px; cursor:pointer; font-size:0.875rem; color:#0d1a0f; border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background='#f0faf2'" onmouseout="this.style.background=''">
      Export all — Download Excel
    </div>
    <div onclick="exportData('all', 'sheets')" style="padding:12px 16px; cursor:pointer; font-size:0.875rem; color:#0d1a0f;" onmouseover="this.style.background='#f0faf2'" onmouseout="this.style.background=''">
      Export all — Google Sheets
    </div>
  `;
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(dropdown);
  setTimeout(() => {
    document.addEventListener('click', closeExportDropdownOutside);
  }, 0);
}

function closeExportDropdown() {
  const dropdown = document.getElementById('export-dropdown');
  if (dropdown) dropdown.remove();
  const table = document.getElementById('applications-table');
  if (table) table.classList.remove('export-mode');
  document.removeEventListener('click', closeExportDropdownOutside);
}

function closeExportDropdownOutside(e) {
  const dropdown = document.getElementById('export-dropdown');
  if (dropdown && !dropdown.contains(e.target)) closeExportDropdown();
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
    if (view === 'payments') {
      loadPayments();
    }
  };
}

function toggleAppSelection(id, checked) {
  if (checked) {
    selectedApplicationIds.add(id);
  } else {
    selectedApplicationIds.delete(id);
  }
  document.querySelectorAll(`[data-id="${id}"]`).forEach(input => {
    input.checked = checked;
  });
  syncSelectAllApplications();
}

function toggleAllApplications(checked) {
  const ids = allApplications.map(app => app.id);
  if (checked) {
    ids.forEach(id => selectedApplicationIds.add(id));
  } else {
    ids.forEach(id => selectedApplicationIds.delete(id));
  }

  document.querySelectorAll('.app-checkbox').forEach(input => {
    input.checked = checked;
  });

  renderSelectExportList(allApplications);
  syncSelectAllApplications();
}

function syncSelectAllApplications() {
  const selectAll = document.getElementById('select-all-applications');
  if (!selectAll) return;

  const total = allApplications.length;
  const selected = allApplications.filter(app => selectedApplicationIds.has(app.id)).length;

  selectAll.checked = total > 0 && selected === total;
  selectAll.indeterminate = selected > 0 && selected < total;
}

function openSelectExportModal() {
  const dropdown = document.getElementById('export-dropdown');
  if (dropdown) dropdown.remove();
  document.removeEventListener('click', closeExportDropdownOutside);
  const table = document.getElementById('applications-table');
  if (table) table.classList.add('export-mode');
  let modal = document.getElementById('select-export-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'select-export-modal';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000;
      display:flex; align-items:center; justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:#fff; border-radius:16px; padding:1.5rem; width:90%; max-width:500px; max-height:80vh; display:flex; flex-direction:column; gap:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:1rem; color:#0a7a24; margin:0;">Select Applications to Export</h3>
          <div onclick="closeSelectExportModal()" style="cursor:pointer; font-size:1.2rem; color:#999;">✕</div>
        </div>
        <input id="select-export-search" type="text" placeholder="Search by name, parent or reference..."
          style="border:1px solid #e0e0e0; border-radius:8px; padding:10px 12px; font-size:0.875rem; outline:none; width:100%; box-sizing:border-box;"
          oninput="filterSelectExportList(this.value)">
        <div id="select-export-list" style="overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:6px;">
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="exportData('selected', 'xlsx')"
            style="flex:1; padding:10px; background:#0a7a24; color:#fff; border:none; border-radius:8px; font-size:0.875rem; cursor:pointer; min-width:140px;">
            Download Excel
          </button>
          <button onclick="exportData('selected', 'sheets')"
            style="flex:1; padding:10px; background:#fff; color:#0a7a24; border:2px solid #0a7a24; border-radius:8px; font-size:0.875rem; cursor:pointer; min-width:140px;">
            Export to Google Sheets
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeSelectExportModal(); });
  }
  renderSelectExportList(allApplications);
  modal.style.display = 'flex';
}

function closeSelectExportModal() {
  const modal = document.getElementById('select-export-modal');
  if (modal) modal.style.display = 'none';
  const table = document.getElementById('applications-table');
  if (table) table.classList.remove('export-mode');
}

function renderSelectExportList(data) {
  const list = document.getElementById('select-export-list');
  if (!list) return;
  if (data.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#999; font-size:0.875rem;">No applications found.</p>`;
    return;
  }
  list.innerHTML = data.map(app => `
    <label style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid #f0f0f0; border-radius:8px; cursor:pointer; font-size:0.875rem;">
      <input type="checkbox" data-id="${app.id}" style="accent-color:#0a7a24; width:15px; height:15px;"
        ${selectedApplicationIds.has(app.id) ? 'checked' : ''}
        onchange="toggleAppSelection(${app.id}, this.checked)">
      <div>
        <div style="font-weight:600; color:#0d1a0f;">${app.student}</div>
        <div style="color:#999; font-size:0.75rem;">${app.class_name} · ${app.parent} · ${app.reference}</div>
      </div>
    </label>
  `).join('');
}

function filterSelectExportList(val) {
  const q = val.toLowerCase().trim();
  const filtered = q
    ? allApplications.filter(a =>
        (a.student || '').toLowerCase().includes(q) ||
        (a.parent || '').toLowerCase().includes(q) ||
        (a.reference || '').toLowerCase().includes(q))
    : allApplications;
  renderSelectExportList(filtered);
}

function buildExportRows(data) {
  const headers = [
    'Full Name', 'Date of Birth', 'Age', 'Gender', 'Nationality', 'Class',
    'Preferred Contact', 'Parent Name', 'Parent Relationship', 'Parent Email',
    'Parent Phone', 'Parent Phone 2', 'Parent Occupation', 'Parent Workplace',
    'Parent Work Address', 'Parent Home Address', 'Emergency Contact Name',
    'Emergency Contact Phone', 'Emergency Contact Relationship', 'Medical Info',
    'Payment Reference', 'Amount Paid', 'Payment Status', 'Date Applied'
  ];
  const rows = data.map(a => [
    a.full_name || a.student || '',
    a.date_of_birth || '',
    a.age || '',
    a.gender || '',
    a.nationality || '',
    a.class_name || '',
    a.preferred_contact_method || '',
    a.parent_name || a.parent || '',
    a.parent_relationship || '',
    a.parent_email || '',
    a.parent_phone || '',
    a.parent_phone_2 || '',
    a.parent_occupation || '',
    a.parent_workplace || '',
    a.parent_work_address || '',
    a.parent_home_address || '',
    a.emergency_contact_name || '',
    a.emergency_contact_phone || '',
    a.emergency_contact_relationship || '',
    a.medical_information || '',
    a.payment_reference || a.reference || '',
    a.amount_paid || a.amount || '',
    a.payment_status || '',
    a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB') : ''
  ]);
  return [headers, ...rows];
}

function exportData(scope, format) {
  let data = [];
  if (scope === 'selected') {
    if (selectedApplicationIds.size === 0) {
      alert('Please select at least one application first.');
      return;
    }
    data = allApplications.filter(a => selectedApplicationIds.has(a.id));
  } else {
    data = allApplications;
  }

  const rows = buildExportRows(data);

  if (format === 'xlsx') {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (cell) cell.s = { font: { bold: true } };
    }
    ws['!cols'] = rows[0].map((_, i) => ({
      wch: Math.max(...rows.map(r => String(r[i] || '').length), 10)
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    XLSX.writeFile(wb, `DGPS-Applications-${new Date().toISOString().slice(0,10)}.xlsx`);
    closeSelectExportModal();
    closeExportDropdown();
  } else if (format === 'sheets') {
    googleSignInThenExport(rows);
  }
}

function googleSignInThenExport(rows) {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPES,
    callback: (response) => {
      if (response.error) {
        alert('Google sign-in failed. Please try again.');
        return;
      }
      googleAccessToken = response.access_token;
      createGoogleSheet(rows);
    }
  });
  client.requestAccessToken();
}

async function createGoogleSheet(rows) {
  const title = `DGPS Applications — ${new Date().toLocaleDateString('en-GB')}`;

  try {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: { title } })
    });
    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z${rows.length}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rows })
    });

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.04, green: 0.48, blue: 0.14 } } },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          },
          {
            updateSheetProperties: {
              properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      })
    });

    window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    closeSelectExportModal();
    closeExportDropdown();
  } catch (err) {
    console.error('Google Sheets export failed:', err);
    alert('Failed to export to Google Sheets. Please try again.');
  }
}

// Load on page ready if already on applications or dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Show loading state immediately
  const tbodies = document.querySelectorAll('tbody');
  tbodies.forEach(tb => {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">Loading...</td></tr>`;
  });

  // Wake Render, then load all data
  fetch(`${API_BASE}/`, { method: 'HEAD', mode: 'no-cors' })
    .catch(() => {})
    .finally(() => {
      loadApplications();
      loadPaymentStats();
      loadPayments();
      loadParents();
    });

  const searchInput = document.querySelector('.topbar-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => searchApplications(e.target.value));
  }
});
