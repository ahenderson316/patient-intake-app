const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'patients.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readPatients() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writePatients(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all patients (summary list for dashboard)
app.get('/api/patients', (req, res) => {
  let patients = readPatients();
  const { search, status, date } = req.query;

  if (search) {
    const q = search.toLowerCase();
    patients = patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.chiefComplaint.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    patients = patients.filter(p => p.status === status);
  }

  if (date) {
    patients = patients.filter(p => p.submittedAt.startsWith(date));
  }

  // Return summary (no full medical history in list view)
  const summary = patients.map(({ id, firstName, lastName, dateOfBirth, email, phone,
    chiefComplaint, status, submittedAt, reviewedAt, reviewedBy }) => ({
    id, firstName, lastName, dateOfBirth, email, phone,
    chiefComplaint, status, submittedAt, reviewedAt, reviewedBy
  }));

  res.json(summary);
});

// GET single patient (full record)
app.get('/api/patients/:id', (req, res) => {
  const patients = readPatients();
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// POST submit new intake
app.post('/api/patients', (req, res) => {
  const required = ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone', 'chiefComplaint'];
  for (const field of required) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  const patients = readPatients();
  const newPatient = {
    id: uuidv4(),
    ...req.body,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };

  patients.unshift(newPatient);
  writePatients(patients);
  res.status(201).json({ id: newPatient.id, message: 'Intake submitted successfully' });
});

// PATCH update status (mark reviewed, etc.)
app.patch('/api/patients/:id', (req, res) => {
  const patients = readPatients();
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });

  const { status, reviewedBy, notes } = req.body;
  if (status) patients[index].status = status;
  if (reviewedBy) patients[index].reviewedBy = reviewedBy;
  if (notes !== undefined) patients[index].notes = notes;
  if (status === 'reviewed') {
    patients[index].reviewedAt = new Date().toISOString();
  }

  writePatients(patients);
  res.json(patients[index]);
});

// DELETE patient record
app.delete('/api/patients/:id', (req, res) => {
  const patients = readPatients();
  const filtered = patients.filter(p => p.id !== req.params.id);
  if (filtered.length === patients.length) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  writePatients(filtered);
  res.json({ message: 'Record deleted' });
});

// GET stats for dashboard header
app.get('/api/stats', (req, res) => {
  const patients = readPatients();
  const today = new Date().toISOString().split('T')[0];
  res.json({
    total: patients.length,
    pending: patients.filter(p => p.status === 'pending').length,
    reviewed: patients.filter(p => p.status === 'reviewed').length,
    today: patients.filter(p => p.submittedAt.startsWith(today)).length
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Patient Intake App running at http://localhost:${PORT}`);
});
