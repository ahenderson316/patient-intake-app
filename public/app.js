const API = '/api';

// ── View Switching ────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.view === name);
  });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showView(link.dataset.view);
    if (link.dataset.view === 'dashboard') loadDashboard();
  });
});

document.getElementById('newIntakeBtn').addEventListener('click', () => showView('intake'));
document.getElementById('backToDashboard').addEventListener('click', () => {
  showView('dashboard');
  loadDashboard();
});

// ── Dashboard ─────────────────────────────────────────────────
async function loadDashboard() {
  await Promise.all([loadStats(), loadPatients()]);
}

async function loadStats() {
  const res = await fetch(`${API}/stats`);
  const stats = await res.json();
  document.getElementById('statTotal').textContent = stats.total;
  document.getElementById('statPending').textContent = stats.pending;
  document.getElementById('statReviewed').textContent = stats.reviewed;
  document.getElementById('statToday').textContent = stats.today;
}

async function loadPatients() {
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('filterStatus').value;
  const date = document.getElementById('filterDate').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (date) params.set('date', date);

  const res = await fetch(`${API}/patients?${params}`);
  const patients = await res.json();
  renderTable(patients);
}

function renderTable(patients) {
  const tbody = document.getElementById('patientTableBody');
  tbody.innerHTML = '';

  if (patients.length === 0) {
    tbody.innerHTML = '<tr id="tableEmpty"><td colspan="6" class="empty-row">No patients found.</td></tr>';
    return;
  }

  patients.forEach(p => {
    const tr = document.createElement('tr');
    const age = calcAge(p.dateOfBirth);
    const submitted = formatDateTime(p.submittedAt);

    tr.innerHTML = `
      <td>
        <div class="patient-name">${escHtml(p.firstName)} ${escHtml(p.lastName)}</div>
        <div class="patient-email">${escHtml(p.email)}</div>
      </td>
      <td>${formatDate(p.dateOfBirth)} ${age ? `<span style="color:var(--text-muted)">(${age}y)</span>` : ''}</td>
      <td class="complaint-cell" title="${escHtml(p.chiefComplaint)}">${escHtml(p.chiefComplaint)}</td>
      <td>${submitted}</td>
      <td><span class="status-badge status-${p.status}">${p.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-view" data-id="${p.id}">View</button>
          ${p.status === 'pending' ? `<button class="btn-sm btn-review" data-id="${p.id}">Review</button>` : ''}
          <button class="btn-sm btn-delete" data-id="${p.id}">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-view').addEventListener('click', () => openPatientModal(p.id));
    tr.querySelector('.btn-delete').addEventListener('click', () => deletePatient(p.id));
    const reviewBtn = tr.querySelector('.btn-review');
    if (reviewBtn) reviewBtn.addEventListener('click', () => markReviewed(p.id));

    tbody.appendChild(tr);
  });
}

// ── Filters ───────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', loadPatients);
document.getElementById('filterStatus').addEventListener('change', loadPatients);
document.getElementById('filterDate').addEventListener('change', loadPatients);

// ── Patient Detail Modal ──────────────────────────────────────
async function openPatientModal(id) {
  const res = await fetch(`${API}/patients/${id}`);
  const p = await res.json();

  document.getElementById('modalPatientName').textContent =
    `${p.firstName} ${p.lastName}`;

  const age = calcAge(p.dateOfBirth);

  document.getElementById('modalBody').innerHTML = `
    <span class="status-badge status-${p.status}" style="margin-bottom:16px;display:inline-flex">${p.status}</span>

    <div class="detail-section-title">Personal Information</div>
    <div class="detail-grid">
      ${field('Date of Birth', `${formatDate(p.dateOfBirth)}${age ? ` (${age} years old)` : ''}`)}
      ${field('Biological Sex', p.biologicalSex || '—')}
      ${field('Gender Identity', p.genderIdentity || '—')}
      ${field('Pronouns', p.pronouns || '—')}
    </div>

    <div class="detail-section-title">Contact</div>
    <div class="detail-grid">
      ${field('Email', p.email)}
      ${field('Phone', p.phone)}
      ${field('Address', [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || '—')}
      ${field('Emergency Contact', p.emergencyName ? `${p.emergencyName} — ${p.emergencyPhone || ''}` : '—')}
    </div>

    <div class="detail-section-title">Visit</div>
    <div class="detail-grid">
      ${field('Submitted', formatDateTime(p.submittedAt))}
      ${field('Pain Level', p.painLevel !== undefined && p.painLevel !== '' ? `${p.painLevel}/10` : '—')}
      ${field('Symptom Duration', p.symptomDuration || '—')}
    </div>
    <p class="detail-label" style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Chief Complaint</p>
    <p class="detail-full">${escHtml(p.chiefComplaint)}</p>

    <div class="detail-section-title">Medical History</div>
    ${longField('Conditions', p.medicalHistory)}
    ${longField('Surgeries', p.surgicalHistory)}
    ${longField('Family History', p.familyHistory)}
    ${longField('Allergies', p.allergies)}
    ${longField('Medications', p.medications)}

    <div class="detail-section-title">Lifestyle</div>
    <div class="detail-grid">
      ${field('Smoking', p.smokingStatus || '—')}
      ${field('Alcohol', p.alcoholUse || '—')}
      ${field('Exercise', p.exerciseFrequency || '—')}
      ${field('Occupation', p.occupation || '—')}
    </div>

    <div class="detail-section-title">Insurance</div>
    <div class="detail-grid">
      ${field('Provider', p.insuranceProvider || '—')}
      ${field('Member ID', p.insuranceMemberId || '—')}
      ${field('Group #', p.insuranceGroupNumber || '—')}
      ${field('Policy Holder', p.policyHolderName || '—')}
    </div>

    <div class="detail-section-title">Provider Notes</div>
    <textarea class="notes-box" id="modalNotes" rows="4" placeholder="Add clinical notes...">${escHtml(p.notes || '')}</textarea>

    <div class="modal-actions">
      ${p.status === 'pending'
        ? `<button class="btn-sm btn-review" id="modalReviewBtn" data-id="${p.id}">Mark as Reviewed</button>`
        : ''}
      <button class="btn-sm btn-view" id="modalSaveNotes" data-id="${p.id}">Save Notes</button>
      <button class="btn-sm btn-delete" id="modalDeleteBtn" data-id="${p.id}">Delete Record</button>
    </div>
  `;

  const reviewBtn = document.getElementById('modalReviewBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', async () => {
      await markReviewed(p.id);
      closeModal();
    });
  }

  document.getElementById('modalSaveNotes').addEventListener('click', async () => {
    const notes = document.getElementById('modalNotes').value;
    await fetch(`${API}/patients/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    showToast('Notes saved');
  });

  document.getElementById('modalDeleteBtn').addEventListener('click', async () => {
    await deletePatient(p.id);
    closeModal();
  });

  document.getElementById('patientModal').classList.remove('hidden');
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('patientModal').classList.add('hidden');
}

// ── Actions ───────────────────────────────────────────────────
async function markReviewed(id) {
  await fetch(`${API}/patients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'reviewed', reviewedBy: 'Dr. Provider' })
  });
  loadDashboard();
}

async function deletePatient(id) {
  if (!confirm('Permanently delete this patient record?')) return;
  await fetch(`${API}/patients/${id}`, { method: 'DELETE' });
  loadDashboard();
}

// ── Intake Form ───────────────────────────────────────────────
document.getElementById('intakeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = document.getElementById('formError');
  const successEl = document.getElementById('formSuccess');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  // Gather all fields
  const data = {};
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') {
      data[el.name] = el.checked;
    } else {
      data[el.name] = el.value.trim();
    }
  });

  // Validate consents
  if (!data.consentTreatment || !data.consentPrivacy || !data.consentAccuracy) {
    errorEl.textContent = 'Please accept all consent agreements before submitting.';
    errorEl.classList.remove('hidden');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  try {
    const res = await fetch(`${API}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      errorEl.textContent = err.error || 'Submission failed. Please try again.';
      errorEl.classList.remove('hidden');
      return;
    }

    form.reset();
    successEl.innerHTML = `
      <strong>✓ Intake submitted successfully!</strong><br/>
      Your information has been received. A provider will review your intake shortly.
    `;
    successEl.classList.remove('hidden');
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    errorEl.textContent = 'Network error. Please check your connection and try again.';
    errorEl.classList.remove('hidden');
  }
});

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed; bottom:24px; right:24px; background:#0f1f38; color:white;
    padding:12px 20px; border-radius:8px; font-size:0.875rem; font-weight:500;
    box-shadow:0 4px 16px rgba(0,0,0,0.2); z-index:999; animation:fadeIn 0.2s ease;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── Helpers ───────────────────────────────────────────────────
function field(label, value) {
  return `<div class="detail-item">
    <div class="detail-label">${label}</div>
    <div class="detail-value">${escHtml(String(value || '—'))}</div>
  </div>`;
}

function longField(label, value) {
  if (!value) return '';
  return `
    <p class="detail-label" style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${label}</p>
    <p class="detail-full">${escHtml(value)}</p>
  `;
}

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────
loadDashboard();
