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

function exportCSV(scope) {
  const data = scope === 'all' ? allApplications : (
    currentFilter === 'all' ? allApplications :
    allApplications.filter(a =>
      scope === 'current'
        ? (currentFilter === 'paid' ? a.payment_status === 'paid' : a.payment_status !== 'paid')
        : true
    )
  );

  const headers = [
    'Full Name', 'Date of Birth', 'Age', 'Gender', 'Nationality', 'Class', 'Preferred Contact',
    'Parent Name', 'Parent Relationship', 'Parent Email', 'Parent Phone', 'Parent Phone 2',
    'Parent Occupation', 'Parent Workplace', 'Parent Work Address', 'Parent Home Address',
    'Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Contact Relationship',
    'Medical Info', 'Payment Reference', 'Amount Paid', 'Payment Status', 'Date Applied'
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
  ].map(v => `"${String(v).replace(/"/g, '""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DGPS-Applications-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  closeExportDropdown();
}

function toggleExportDropdown() {
  let dropdown = document.getElementById('export-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }
  const btn = document.querySelector('#view-applications .btn-outline');
  dropdown = document.createElement('div');
  dropdown.id = 'export-dropdown';
  dropdown.style.cssText = `
    position:absolute; background:#fff; border:1px solid #e0e0e0;
    border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.12);
    z-index:200; min-width:200px; overflow:hidden;
  `;
  dropdown.innerHTML = `
    <div onclick="exportCSV('current')" style="padding:12px 16px; cursor:pointer; font-size:0.875rem; color:#0d1a0f; border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background='#f0faf2'" onmouseout="this.style.background=''">
      Export current view
    </div>
    <div onclick="exportCSV('all')" style="padding:12px 16px; cursor:pointer; font-size:0.875rem; color:#0d1a0f;" onmouseover="this.style.background='#f0faf2'" onmouseout="this.style.background=''">
      Export all applications
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
    });

  const searchInput = document.querySelector('.topbar-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => searchApplications(e.target.value));
  }
});
