import React from 'react';
import './App.css';

// Keep your existing code below


import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock3, Plus, Search, Stethoscope, Trash2, Users, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const today = new Date().toISOString().slice(0, 10);
const emptyPatient = { name: "", email: "", phone: "" };
const emptyAppointment = { patientId: "", doctor: "Dr. Ananya Menon", department: "General Medicine", date: today, time: "10:00", reason: "" };

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Check that the backend is running.");
  return data;
}

function App() {
  const [tab, setTab] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([request("/patients"), request("/appointments")]);
      setPatients(p);
      setAppointments(a);
      setAppointmentForm(current => ({ ...current, patientId: current.patientId || p[0]?._id || "" }));
    } catch (e) {
      setError(`${e.message} Make sure MongoDB and the backend are running.`);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filteredAppointments = useMemo(() => appointments.filter(a => {
    const matchesText = `${a.patientName} ${a.patientEmail} ${a.doctor} ${a.department}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesText && matchesStatus;
  }), [appointments, search, statusFilter]);

  const stats = [
    { label: "Total appointments", value: appointments.length, icon: CalendarDays, tone: "teal" },
    { label: "Pending requests", value: appointments.filter(a => a.status === "Pending").length, icon: Clock3, tone: "amber" },
    { label: "Confirmed", value: appointments.filter(a => a.status === "Confirmed").length, icon: CheckCircle2, tone: "green" },
    { label: "Registered patients", value: patients.length, icon: Users, tone: "blue" }
  ];

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function registerPatient(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const patient = await request("/patients", { method: "POST", body: JSON.stringify(patientForm) });
      setPatients(current => [patient, ...current]);
      setAppointmentForm(current => ({ ...current, patientId: patient._id }));
      setPatientForm(emptyPatient);
      setShowPatientForm(false);
      notify("Patient registered successfully.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function bookAppointment(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const appointment = await request("/appointments", { method: "POST", body: JSON.stringify(appointmentForm) });
      setAppointments(current => [...current, appointment].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)));
      setAppointmentForm(current => ({ ...emptyAppointment, patientId: current.patientId }));
      setShowAppointmentForm(false);
      notify("Appointment booked successfully.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    setError("");
    try {
      const updated = await request(`/appointments/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setAppointments(current => current.map(a => a._id === id ? updated : a));
      notify(`Appointment marked ${status.toLowerCase()}.`);
    } catch (e) { setError(e.message); }
  }

  async function deleteAppointment(id) {
    if (!window.confirm("Delete this appointment?")) return;
    setError("");
    try {
      await request(`/appointments/${id}`, { method: "DELETE" });
      setAppointments(current => current.filter(a => a._id !== id));
      notify("Appointment deleted.");
    } catch (e) { setError(e.message); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Activity size={23} /></div><div><strong>MediBook</strong><span>Care made simpler</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}><Activity size={18}/> Dashboard</button>
      <button className={`nav-item ${tab === "appointments" ? "active" : ""}`} onClick={() => setTab("appointments")}><CalendarDays size={18}/> Appointments <span className="nav-count">{appointments.length}</span></button>
      <button className={`nav-item ${tab === "patients" ? "active" : ""}`} onClick={() => setTab("patients")}><Users size={18}/> Patients <span className="nav-count">{patients.length}</span></button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Stethoscope size={20}/></div><strong>Clinic management</strong><p>Keep appointment details organized in one place.</p></div><div className="profile"><div className="avatar">AD</div><div><strong>Admin dashboard</strong><span>Demo workspace</span></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="eyebrow">CLINIC MANAGEMENT</span><h1>{tab === "dashboard" ? "Dashboard overview" : tab === "appointments" ? "Appointments" : "Patient directory"}</h1><p>Welcome back. Here's what's happening at your clinic.</p></div><button className="primary-btn" onClick={() => { setError(""); setShowAppointmentForm(true); }}><Plus size={18}/> Book appointment</button></header>
      {error && <div className="alert error-alert"><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
      {notice && <div className="alert success-alert"><CheckCircle2 size={18}/>{notice}</div>}

      {tab !== "patients" && <section className="stats-grid">{stats.map(({label, value, icon: Icon, tone}) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div><p>{label}</p><strong>{value}</strong></div></article>)}</section>}

      {tab === "dashboard" && <div className="content-grid">
        <section className="panel appointments-panel"><div className="panel-head"><div><h2>Upcoming appointments</h2><p>Review and manage scheduled visits</p></div><button className="text-btn" onClick={() => setTab("appointments")}>View all →</button></div><AppointmentTable appointments={filteredAppointments.slice(0, 5)} onStatus={updateStatus} onDelete={deleteAppointment} loading={loading}/></section>
        <section className="panel quick-panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Common clinic tasks</p></div></div><button className="quick-action" onClick={() => setShowPatientForm(true)}><span className="quick-icon lavender"><Users size={20}/></span><span><strong>Register a patient</strong><small>Add patient contact details</small></span><span className="arrow">↗</span></button><button className="quick-action" onClick={() => setShowAppointmentForm(true)}><span className="quick-icon mint"><CalendarDays size={20}/></span><span><strong>Book appointment</strong><small>Schedule a clinic visit</small></span><span className="arrow">↗</span></button><div className="note-card"><strong>Appointment workflow</strong><p>New bookings start as Pending. Confirm them after reviewing the clinic schedule.</p></div></section>
      </div>}

      {tab === "appointments" && <section className="panel full-panel"><div className="panel-head"><div><h2>All appointments</h2><p>Search, filter, update status, or remove a booking.</p></div></div><div className="filters"><label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, doctor, department..."/></label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></div><AppointmentTable appointments={filteredAppointments} onStatus={updateStatus} onDelete={deleteAppointment} loading={loading}/></section>}

      {tab === "patients" && <section className="panel full-panel"><div className="panel-head"><div><h2>Registered patients</h2><p>Patients who can book appointments.</p></div><button className="primary-btn small" onClick={() => setShowPatientForm(true)}><Plus size={17}/> Add patient</button></div>{loading ? <div className="empty-state">Loading patients…</div> : patients.length === 0 ? <div className="empty-state"><Users size={30}/><strong>No patients registered yet</strong><span>Register your first patient to start booking.</span><button className="primary-btn small" onClick={() => setShowPatientForm(true)}>Register patient</button></div> : <div className="patient-grid">{patients.map(p => <article className="patient-card" key={p._id}><div className="patient-avatar">{p.name.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{p.name}</strong><span>{p.email}</span><span>{p.phone}</span></div><span className="patient-badge">Patient</span></article>)}</div>}</section>}

    </main>

    {showPatientForm && <Modal title="Register a patient" subtitle="Enter the patient's basic contact details." onClose={() => setShowPatientForm(false)}><form onSubmit={registerPatient} className="form-stack"><Field label="Full name"><input required maxLength="100" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name:e.target.value})} placeholder="e.g. Alex Thomas"/></Field><Field label="Email address"><input required type="email" value={patientForm.email} onChange={e => setPatientForm({...patientForm, email:e.target.value})} placeholder="alex@example.com"/></Field><Field label="Phone number"><input required value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone:e.target.value})} placeholder="Phone number"/></Field><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowPatientForm(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Register patient"}</button></div></form></Modal>}

    {showAppointmentForm && <Modal title="Book an appointment" subtitle="Choose a registered patient and appointment slot." onClose={() => setShowAppointmentForm(false)}><form onSubmit={bookAppointment} className="form-stack"><Field label="Patient"><select required value={appointmentForm.patientId} onChange={e => setAppointmentForm({...appointmentForm, patientId:e.target.value})}><option value="">Select patient</option>{patients.map(p => <option key={p._id} value={p._id}>{p.name} · {p.email}</option>)}</select>{patients.length === 0 && <small className="field-hint">Register a patient first.</small>}</Field><Field label="Doctor"><select value={appointmentForm.doctor} onChange={e => setAppointmentForm({...appointmentForm, doctor:e.target.value})}><option>Dr. Ananya Menon</option><option>Dr. Rahul Nair</option><option>Dr. Meera Joseph</option></select></Field><Field label="Department"><select value={appointmentForm.department} onChange={e => setAppointmentForm({...appointmentForm, department:e.target.value})}><option>General Medicine</option><option>Cardiology</option><option>Dermatology</option><option>Pediatrics</option><option>Orthopedics</option></select></Field><div className="form-row"><Field label="Date"><input required type="date" min={today} value={appointmentForm.date} onChange={e => setAppointmentForm({...appointmentForm, date:e.target.value})}/></Field><Field label="Time"><select required value={appointmentForm.time} onChange={e => setAppointmentForm({...appointmentForm, time:e.target.value})}>{["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00"].map(t => <option key={t}>{t}</option>)}</select></Field></div><Field label="Reason for visit (optional)"><textarea rows="3" maxLength="500" value={appointmentForm.reason} onChange={e => setAppointmentForm({...appointmentForm, reason:e.target.value})} placeholder="Brief reason for appointment"/></Field><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowAppointmentForm(false)}>Cancel</button><button className="primary-btn" disabled={saving || !patients.length}>{saving ? "Booking..." : "Confirm booking"}</button></div></form></Modal>}
  </div>;
}

function Field({label, children}) { return <label className="field"><span>{label}</span>{children}</label>; }

function Modal({title, subtitle, onClose, children}) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div>{children}</section></div>;
}

function AppointmentTable({appointments, onStatus, onDelete, loading}) {
  if (loading) return <div className="empty-state">Loading appointments…</div>;
  if (!appointments.length) return <div className="empty-state"><CalendarDays size={30}/><strong>No appointments found</strong><span>Book an appointment or change your search filter.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor / department</th><th>Date & time</th><th>Status</th><th>Actions</th></tr></thead><tbody>{appointments.map(a => <tr key={a._id}><td><div className="patient-cell"><div className="mini-avatar">{a.patientName.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{a.patientName}</strong><span>{a.patientEmail}</span></div></div></td><td><strong>{a.doctor}</strong><span className="cell-sub">{a.department}</span></td><td><strong>{new Date(`${a.date}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</strong><span className="cell-sub">{a.time}</span></td><td><select className={`status-select ${a.status.toLowerCase()}`} value={a.status} onChange={e => onStatus(a._id, e.target.value)} aria-label={`Status for ${a.patientName}`}><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></td><td><button className="delete-btn" title="Delete appointment" aria-label="Delete appointment" onClick={() => onDelete(a._id)}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>;
}

export default App;
