# ClearChart — Patient Intake App

A full-stack **healthtech** application built with **Node.js**, **Express**, and **vanilla JavaScript**. Features a patient-facing intake form and a clinical provider dashboard.

## Features

### Patient Intake Form
- Personal information (name, DOB, gender identity, pronouns)
- Contact details and emergency contact
- Chief complaint with pain level and symptom duration
- Medical history, surgical history, family history
- Allergies and current medications
- Lifestyle and social history (smoking, alcohol, exercise)
- Insurance information
- HIPAA consent checkboxes

### Provider Dashboard
- Stats overview: total patients, pending reviews, reviewed, submitted today
- Searchable and filterable patient table (by name, status, date)
- Full patient detail modal with all intake data
- Mark records as reviewed
- Add/save provider clinical notes
- Delete patient records

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express
- **Storage:** JSON file (swappable for PostgreSQL, MongoDB, etc.)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher

### Installation

```bash
# Clone the repo
git clone https://github.com/ahenderson316/patient-intake-app.git
cd patient-intake-app

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients (supports `?search=`, `?status=`, `?date=`) |
| GET | `/api/patients/:id` | Get full patient record |
| POST | `/api/patients` | Submit new intake |
| PATCH | `/api/patients/:id` | Update status, notes, or reviewed-by |
| DELETE | `/api/patients/:id` | Delete patient record |
| GET | `/api/stats` | Dashboard summary stats |

## Project Structure

```
patient-intake-app/
├── public/
│   ├── index.html       # Patient intake form + provider dashboard SPA
│   ├── style.css        # Clinical light-theme UI
│   └── app.js           # Frontend logic
├── server.js            # Express API server
├── patients.json        # Auto-created on first run
├── package.json
└── README.md
```

## License

MIT
