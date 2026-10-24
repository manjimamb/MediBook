# MediBook – MERN Clinic Appointment Booking System

A student-friendly full-stack project using MongoDB, Express.js, React.js, and Node.js.

## Features
- Patient registration
- Create and view clinic appointments
- Update appointment status/details
- Delete appointments
- Admin dashboard with appointment counts
- Search/filter appointments by patient name and status
- Responsive UI and basic form validation

> This is an educational starter project. It does not include secure login, role-based authorization, or production-grade handling of real patient data. Do not enter real sensitive medical information.

## Requirements
- Node.js (LTS)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Setup

1. Extract this ZIP and open the `medibook-mern` folder in VS Code.
2. Install root and app dependencies:
   ```bash
   npm install
   npm run install:all
   ```
3. Create `backend/.env` by copying `backend/.env.example`.
4. Ensure MongoDB is running and update `MONGODB_URI` in `backend/.env` if needed.
5. Start both applications:
   ```bash
   npm run dev
   ```
6. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.
   Backend API: `http://localhost:5000/api/health`

## API endpoints
- `GET /api/health` – API status
- `GET /api/patients` – list patients
- `POST /api/patients` – register patient
- `GET /api/appointments` – list appointments (optional `?status=Pending` or `?search=alex`)
- `GET /api/appointments/:id` – get one appointment
- `POST /api/appointments` – create appointment
- `PUT /api/appointments/:id` – update appointment
- `DELETE /api/appointments/:id` – delete appointment

## Notes
- The backend validates required fields and appointment dates.
- This project is a learning prototype. Add authentication, authorization, rate limiting, secure deployment, and privacy controls before any real-world use.
