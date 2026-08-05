import React, { useEffect, useState, useMemo } from 'react';
import { AppointmentService, AppointmentQueryParams } from '../services/appointment.service';
import { DoctorService } from '../services/doctor.service';
import { PatientService } from '../services/patient.service';
import { Appointment, CreateAppointmentFormData, AppointmentStatus, AppointmentMode } from '../types/appointment';
import { Doctor } from '../types/doctor';
import { Patient } from '../types/patient';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAppSelector } from '../hooks/store';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Stethoscope,
  User,
  Building2,
  FileText,
  Video,
  MapPin,
  Check,
  Ban,
  MessageSquare,
  Lock,
  HeartPulse
} from 'lucide-react';

const TIME_SLOTS = [
  '09:00:00',
  '09:30:00',
  '10:00:00',
  '10:30:00',
  '11:00:00',
  '11:30:00',
  '14:00:00',
  '14:30:00',
  '15:00:00',
  '15:30:00',
  '16:00:00',
  '16:30:00'
];

const INITIAL_FORM_DATA: CreateAppointmentFormData = {
  patientId: '',
  doctorId: '',
  departmentId: '',
  appointmentDate: new Date().toISOString().split('T')[0],
  appointmentTime: '10:00:00',
  appointmentMode: 'OFFLINE',
  symptoms: '',
  reason: '',
  status: 'PENDING'
};

export const AppointmentManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role || '';
  const isAdmin = userRole === 'ADMIN';
  const isDoctor = userRole === 'DOCTOR';
  const isPatient = userRole === 'PATIENT';

  // Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [doctorFilter, setDoctorFilter] = useState<string>('');
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<CreateAppointmentFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Doctor Consultation Notes Modal
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [notesTargetAppointment, setNotesTargetAppointment] = useState<Appointment | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  // Delete Dialog
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch Data
  const fetchAppointments = async (
    search = searchQuery,
    status = statusFilter,
    docId = doctorFilter,
    patId = patientFilter,
    dt = dateFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params: AppointmentQueryParams = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (docId) params.doctorId = docId;
      if (patId) params.patientId = patId;
      if (dt) params.date = dt;

      const [aptRes, docRes, patRes] = await Promise.all([
        AppointmentService.getAppointments(params),
        DoctorService.getDoctors(),
        isAdmin || isDoctor ? PatientService.getPatients() : Promise.resolve({ data: [] })
      ]);

      setAppointments(aptRes.data || []);
      setDoctors(docRes.data || []);
      setPatients(patRes.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load appointments from database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments('', '', '', '', '');
  }, []);

  // Filter Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchAppointments(val, statusFilter, doctorFilter, patientFilter, dateFilter);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchAppointments(searchQuery, val, doctorFilter, patientFilter, dateFilter);
  };

  const handleDoctorFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDoctorFilter(val);
    fetchAppointments(searchQuery, statusFilter, val, patientFilter, dateFilter);
  };

  const handlePatientFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPatientFilter(val);
    fetchAppointments(searchQuery, statusFilter, doctorFilter, val, dateFilter);
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateFilter(val);
    fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, val);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDoctorFilter('');
    setPatientFilter('');
    setDateFilter('');
    fetchAppointments('', '', '', '', '');
  };

  // Toast Handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open Book Modal
  const handleOpenAddModal = () => {
    setEditingAppointment(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setActionError(null);
    setIsBookModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({
      patientId: apt.patient_id,
      doctorId: apt.doctor_id,
      departmentId: apt.department_id,
      appointmentDate: apt.appointment_date ? apt.appointment_date.split('T')[0] : '',
      appointmentTime: apt.appointment_time || '10:00:00',
      appointmentMode: apt.appointment_mode || 'OFFLINE',
      symptoms: apt.symptoms || apt.reason || '',
      reason: apt.reason || apt.symptoms || '',
      status: apt.status
    });
    setFormErrors({});
    setActionError(null);
    setIsBookModalOpen(true);
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!isPatient && !formData.patientId) {
      errors.patientId = 'Patient selection is required.';
    }

    if (!formData.doctorId) {
      errors.doctorId = 'Doctor selection is required.';
    }

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Appointment date is required.';
    } else {
      const selected = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.appointmentDate = 'Appointment date cannot be in the past.';
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Time slot is required.';
    }

    if (!formData.symptoms.trim()) {
      errors.symptoms = 'Please describe symptoms or reason for visit.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Booking Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingAppointment) {
        // Update Appointment
        await AppointmentService.updateAppointment(editingAppointment.id, formData);
        showToast(`Appointment '${editingAppointment.appointment_number}' updated successfully.`);
      } else {
        // Create Appointment
        await AppointmentService.createAppointment(formData);
        showToast('New appointment booked successfully.');
      }
      setIsBookModalOpen(false);
      fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Operation failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Status Action Handler (Approve / Reject / Complete / Cancel)
  const handleQuickStatusChange = async (
    apt: Appointment,
    newStatus: AppointmentStatus,
    notes?: string
  ) => {
    try {
      await AppointmentService.updateAppointment(apt.id, {
        status: newStatus,
        consultationNotes: notes
      });
      showToast(`Appointment '${apt.appointment_number}' marked as ${newStatus}.`);
      fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || err?.message || `Failed to update status to ${newStatus}.`
      );
    }
  };

  // Open Notes Modal for Doctor
  const handleOpenNotesModal = (apt: Appointment) => {
    setNotesTargetAppointment(apt);
    setConsultationNotes(apt.consultation_notes || '');
    setActionError(null);
    setIsNotesModalOpen(true);
  };

  // Save Consultation Notes & Complete
  const handleSaveNotes = async (markAsCompleted = false) => {
    if (!notesTargetAppointment) return;

    setSavingNotes(true);
    setActionError(null);
    try {
      const updatedStatus = markAsCompleted ? 'COMPLETED' : notesTargetAppointment.status;
      await AppointmentService.updateAppointment(notesTargetAppointment.id, {
        consultationNotes: consultationNotes.trim(),
        status: updatedStatus
      });
      showToast(
        markAsCompleted
          ? `Appointment '${notesTargetAppointment.appointment_number}' marked as COMPLETED with notes.`
          : `Consultation notes saved for '${notesTargetAppointment.appointment_number}'.`
      );
      setIsNotesModalOpen(false);
      setNotesTargetAppointment(null);
      fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to save consultation notes.'
      );
    } finally {
      setSavingNotes(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (apt: Appointment) => {
    setAppointmentToDelete(apt);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;

    setDeleting(true);
    setActionError(null);
    try {
      await AppointmentService.deleteAppointment(appointmentToDelete.id);
      showToast(`Appointment '${appointmentToDelete.appointment_number}' deleted.`);
      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
      fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to delete appointment.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || doctorFilter || patientFilter || dateFilter
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-bounce-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Management</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Calendar className="w-3.5 h-3.5" /> {appointments.length} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Outpatient consultation bookings, doctor time slots, and status workflow management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter)}
            isLoading={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {!isDoctor && (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 shadow-md shadow-primary-600/20"
            >
              <Plus className="w-4 h-4" />
              Book New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Card: Toolbar + Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, doctor, APT-ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-7 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchAppointments('', statusFilter, doctorFilter, patientFilter, dateFilter);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Doctor Filter Dropdown */}
            <div>
              <select
                value={doctorFilter}
                onChange={handleDoctorFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium truncate"
              >
                <option value="">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.full_name || doc.first_name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1 h-9"
              >
                <X className="w-3.5 h-3.5" /> Clear All Filters
              </Button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => fetchAppointments(searchQuery, statusFilter, doctorFilter, patientFilter, dateFilter)}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-9 h-9 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-600">Fetching appointment schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Appointments Found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {hasActiveFilters
                ? 'No appointments match your search query or filter criteria.'
                : 'No appointments scheduled. Click "Book New Appointment" to schedule one.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          /* Appointments Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">APT Code & Patient</th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4">Date & Time Slot</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Symptoms / Notes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {appointments.map((apt) => {
                  const statusMap: Record<string, 'warning' | 'success' | 'info' | 'danger' | 'neutral'> = {
                    PENDING: 'warning',
                    SCHEDULED: 'warning',
                    CONFIRMED: 'success',
                    IN_PROGRESS: 'info',
                    COMPLETED: 'info',
                    CANCELLED: 'danger',
                    NO_SHOW: 'neutral'
                  };
                  const badgeVariant = statusMap[apt.status] || 'neutral';
                  const isOnline = apt.appointment_mode === 'ONLINE';

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Code & Patient Name */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[11px] font-bold border border-amber-200">
                            {apt.appointment_number}
                          </span>
                          <div className="font-semibold text-slate-900 mt-1">
                            {apt.patient_name || 'Patient'}
                          </div>
                          {apt.patient_code && (
                            <div className="text-xs text-slate-500 font-mono">{apt.patient_code}</div>
                          )}
                        </div>
                      </td>

                      {/* Doctor & Department */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                            {apt.doctor_name}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {apt.department_name} • {apt.doctor_specialization}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700">
                          <div className="font-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {apt.appointment_date ? apt.appointment_date.split('T')[0] : ''}
                          </div>
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {apt.appointment_time}
                          </div>
                        </div>
                      </td>

                      {/* Mode Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isOnline
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isOnline ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {apt.appointment_mode}
                        </span>
                      </td>

                      {/* Symptoms & Consultation Notes */}
                      <td className="py-4 px-4">
                        <div className="text-xs max-w-xs">
                          <p className="text-slate-700 line-clamp-1" title={apt.symptoms || apt.reason || ''}>
                            <strong className="text-slate-900">Symptoms:</strong> {apt.symptoms || apt.reason || 'N/A'}
                          </p>
                          {apt.consultation_notes && (
                            <p className="text-emerald-700 mt-1 line-clamp-1 font-mono text-[11px]" title={apt.consultation_notes}>
                              <strong className="text-emerald-900">Notes:</strong> {apt.consultation_notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant={badgeVariant}>{apt.status}</Badge>
                      </td>

                      {/* Role Actions */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Doctor Quick Actions */}
                          {isDoctor && (
                            <>
                              {apt.status === 'PENDING' && (
                                <button
                                  onClick={() => handleQuickStatusChange(apt, 'CONFIRMED')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
                                  title="Accept Appointment"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept
                                </button>
                              )}
                              {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleOpenNotesModal(apt)}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-md border border-sky-200 flex items-center gap-1 transition-colors"
                                  title="Add Consultation Notes"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> Complete / Notes
                                </button>
                              )}
                            </>
                          )}

                          {/* Patient Actions */}
                          {isPatient && apt.status === 'PENDING' && (
                            <button
                              onClick={() => handleQuickStatusChange(apt, 'CANCELLED')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md border border-rose-200 flex items-center gap-1 transition-colors"
                              title="Cancel Pending Booking"
                            >
                              <Ban className="w-3.5 h-3.5" /> Cancel
                            </button>
                          )}

                          {/* Admin & Staff Controls */}
                          {isAdmin && (
                            <>
                              {apt.status === 'PENDING' && (
                                <button
                                  onClick={() => handleQuickStatusChange(apt, 'CONFIRMED')}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Approve Appointment"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(apt)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                title="Edit / Reschedule"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(apt)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Book / Edit Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">
                  {editingAppointment
                    ? `Reschedule Appointment (${editingAppointment.appointment_number})`
                    : 'Book New Appointment'}
                </h3>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Patient Selector (Admin/Staff only) */}
              {!isPatient && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Patient <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: Number(e.target.value) || '' })
                    }
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      formErrors.patientId
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-primary-500/20'
                    }`}
                  >
                    <option value="">Choose Patient</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.full_name || `${pat.first_name} ${pat.last_name}`} ({pat.patient_code})
                      </option>
                    ))}
                  </select>
                  {formErrors.patientId && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.patientId}</p>
                  )}
                </div>
              )}

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Specialist / Doctor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => {
                    const selectedDocId = Number(e.target.value) || '';
                    const matchedDoc = doctors.find((d) => d.id === selectedDocId);
                    setFormData({
                      ...formData,
                      doctorId: selectedDocId,
                      departmentId: matchedDoc ? matchedDoc.department_id : ''
                    });
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    formErrors.doctorId
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-primary-500/20'
                  }`}
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.full_name || doc.first_name} — {doc.specialization} (${doc.consultation_fee})
                    </option>
                  ))}
                </select>
                {formErrors.doctorId && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.doctorId}</p>
                )}
              </div>

              {/* Date & Time Slot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Appointment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      formErrors.appointmentDate
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-primary-500/20'
                    }`}
                  />
                  {formErrors.appointmentDate && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.appointmentDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Time Slot <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      formErrors.appointmentTime
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-primary-500/20'
                    }`}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot.substring(0, 5)} {Number(slot.substring(0, 2)) >= 12 ? 'PM' : 'AM'}
                      </option>
                    ))}
                  </select>
                  {formErrors.appointmentTime && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.appointmentTime}</p>
                  )}
                </div>
              </div>

              {/* Mode & Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Consultation Format
                  </label>
                  <select
                    value={formData.appointmentMode}
                    onChange={(e) =>
                      setFormData({ ...formData, appointmentMode: e.target.value as AppointmentMode })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                  >
                    <option value="OFFLINE">In-Person (Offline Clinic)</option>
                    <option value="ONLINE">Video Call (Online)</option>
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as AppointmentStatus })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                    >
                      <option value="PENDING">Pending Approval</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Symptoms / Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Symptoms & Reason for Visit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your health symptoms, duration, or reason for requesting a consultation..."
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.symptoms
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-primary-500/20'
                  }`}
                />
                {formErrors.symptoms && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.symptoms}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsBookModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                  {editingAppointment ? 'Save Changes' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consultation Notes Modal for Doctor */}
      {isNotesModalOpen && notesTargetAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-base">
                <Stethoscope className="w-5 h-5" />
                <span>Consultation Notes ({notesTargetAppointment.appointment_number})</span>
              </div>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-1">
                Patient: <strong className="text-slate-800">{notesTargetAppointment.patient_name}</strong>
              </p>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 mt-3">
                Doctor Notes & Clinical Diagnosis
              </label>
              <textarea
                rows={5}
                placeholder="Enter diagnosis, prescribed medication, and follow-up advice..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveNotes(false)}
                isLoading={savingNotes}
              >
                Save Notes
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveNotes(true)}
                isLoading={savingNotes}
              >
                Save & Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete Appointment</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-sm text-slate-600">
              Are you sure you want to delete appointment booking <strong className="text-slate-900">{appointmentToDelete.appointment_number}</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleConfirmDelete} isLoading={deleting}>
                Delete Appointment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
