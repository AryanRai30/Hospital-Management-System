import React, { useEffect, useState, useMemo } from 'react';
import { PatientService, PatientQueryParams } from '../services/patient.service';
import { Patient, CreatePatientFormData } from '../types/patient';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAppSelector } from '../hooks/store';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  User,
  HeartPulse,
  Activity,
  ShieldAlert,
  FileText,
  Lock,
  MapPin,
  ShieldCheck
} from 'lucide-react';

const INITIAL_FORM_DATA: CreatePatientFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  heightCm: '',
  weightKg: '',
  allergies: '',
  medicalConditions: '',
  currentMedications: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  status: true
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PatientManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  // Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<CreatePatientFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Dialog States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch Patients
  const fetchPatients = async (
    search = searchQuery,
    gender = genderFilter,
    bloodGroup = bloodGroupFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params: PatientQueryParams = {};
      if (search.trim()) params.search = search.trim();
      if (gender) params.gender = gender;
      if (bloodGroup) params.bloodGroup = bloodGroup;

      const res = await PatientService.getPatients(params);
      setPatients(res.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load patients from database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients('', '', '');
  }, []);

  // Handle Search & Filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchPatients(val, genderFilter, bloodGroupFilter);
  };

  const handleGenderFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGenderFilter(val);
    fetchPatients(searchQuery, val, bloodGroupFilter);
  };

  const handleBloodGroupFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBloodGroupFilter(val);
    fetchPatients(searchQuery, genderFilter, val);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setGenderFilter('');
    setBloodGroupFilter('');
    fetchPatients('', '', '');
  };

  // Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open Add Patient Modal
  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setActionError(null);
    setIsModalOpen(true);
  };

  // Open Edit Patient Modal
  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      fullName: patient.full_name || `${patient.first_name} ${patient.last_name}`,
      email: patient.email || '',
      phoneNumber: patient.phone_number || '',
      dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      gender: patient.gender || '',
      bloodGroup: patient.blood_group || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      postalCode: patient.postal_code || '',
      emergencyContactName: patient.emergency_contact_name || '',
      emergencyContactPhone: patient.emergency_contact_phone || '',
      heightCm: patient.height_cm !== null && patient.height_cm !== undefined ? patient.height_cm : '',
      weightKg: patient.weight_kg !== null && patient.weight_kg !== undefined ? patient.weight_kg : '',
      allergies: patient.allergies || '',
      medicalConditions: patient.medical_conditions || '',
      currentMedications: patient.current_medications || '',
      insuranceProvider: patient.insurance_provider || '',
      insurancePolicyNumber: patient.insurance_policy_number || '',
      status: Boolean(patient.is_active)
    });
    setFormErrors({});
    setActionError(null);
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email address format.';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required.';
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required.';
    }

    if (!formData.gender) {
      errors.gender = 'Gender selection is required.';
    }

    if (!formData.emergencyContactName.trim()) {
      errors.emergencyContactName = 'Emergency contact name is required.';
    }

    if (!formData.emergencyContactPhone.trim()) {
      errors.emergencyContactPhone = 'Emergency contact phone is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingPatient) {
        // Update Patient
        await PatientService.updatePatient(editingPatient.id, formData);
        showToast(`Patient '${formData.fullName}' updated successfully.`);
      } else {
        // Create Patient
        await PatientService.createPatient(formData);
        showToast(`New Patient '${formData.fullName}' registered successfully.`);
      }
      setIsModalOpen(false);
      fetchPatients(searchQuery, genderFilter, bloodGroupFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Operation failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (patient: Patient) => {
    setPatientToDelete(patient);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    setActionError(null);
    try {
      await PatientService.deletePatient(patientToDelete.id);
      showToast(`Patient '${patientToDelete.full_name}' record deleted successfully.`);
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
      fetchPatients(searchQuery, genderFilter, bloodGroupFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to delete patient.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(searchQuery || genderFilter || bloodGroupFilter);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Management</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <Users className="w-3.5 h-3.5" /> {patients.length} Patients
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Master Medical Record Number (MRN) database, patient demographics, and emergency clinical data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPatients(searchQuery, genderFilter, bloodGroupFilter)}
            isLoading={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isAdmin ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 shadow-md shadow-primary-600/20"
            >
              <Plus className="w-4 h-4" />
              Add New Patient
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Read-only access
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area: Table + Filters */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {/* Search & Filter Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or PAT-ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchPatients('', genderFilter, bloodGroupFilter);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Gender Filter Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={genderFilter}
                onChange={handleGenderFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Blood Group Filter Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={bloodGroupFilter}
                onChange={handleBloodGroupFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              >
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 self-start lg:self-center">
            <span>Showing <strong className="text-slate-700">{patients.length}</strong> patient records</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => fetchPatients(searchQuery, genderFilter, bloodGroupFilter)}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-9 h-9 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-600">Fetching patient records from database...</p>
          </div>
        ) : patients.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Patients Found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {hasActiveFilters
                ? 'No patient records match the applied search and filter criteria.'
                : 'No patients are currently registered in the database. Click "Add New Patient" to register.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Reset Search Filters
              </Button>
            )}
          </div>
        ) : (
          /* Patients Responsive Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Patient Code / Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">DOB & Gender</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Emergency Contact</th>
                  <th className="py-3.5 px-4">Vitals & History</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map((pat) => {
                  const isActive = Boolean(pat.is_active);
                  const avatarText = pat.full_name
                    ? pat.full_name.charAt(0).toUpperCase()
                    : `${pat.first_name?.charAt(0) || ''}${pat.last_name?.charAt(0) || ''}`;

                  return (
                    <tr
                      key={pat.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Patient MRN Code & Name */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                            {avatarText}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug">
                              {pat.full_name || `${pat.first_name} ${pat.last_name}`}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-bold mt-0.5 border border-blue-100">
                              {pat.patient_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{pat.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{pat.phone_number}</span>
                          </div>
                        </div>
                      </td>

                      {/* DOB & Gender */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700 space-y-0.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {pat.date_of_birth ? pat.date_of_birth.split('T')[0] : 'N/A'}
                          </div>
                          <div className="text-slate-500 capitalize">{pat.gender?.toLowerCase()}</div>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {pat.blood_group ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-mono font-bold text-xs border border-rose-200">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                            {pat.blood_group}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Emergency Contact */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700">
                          <div className="font-medium text-slate-900">
                            {pat.emergency_contact_name || 'N/A'}
                          </div>
                          {pat.emergency_contact_phone && (
                            <div className="text-slate-500 font-mono">
                              {pat.emergency_contact_phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Vitals & History Summary */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs space-y-0.5 text-slate-600">
                          {(pat.height_cm || pat.weight_kg) && (
                            <div className="font-medium text-slate-800">
                              {pat.height_cm ? `${pat.height_cm}cm` : ''} {pat.weight_kg ? `(${pat.weight_kg}kg)` : ''}
                            </div>
                          )}
                          {pat.allergies ? (
                            <div className="text-amber-700 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <span className="truncate max-w-[140px]" title={pat.allergies}>
                                {pat.allergies}
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400">No known allergies</div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant={isActive ? 'success' : 'neutral'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(pat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Edit Patient"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(pat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Patient Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">
                  {editingPatient ? `Edit Patient (${editingPatient.patient_code})` : 'Register New Patient'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Section 1: Demographics */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5 border-b pb-1">
                  <User className="w-4 h-4 text-primary-600" /> Personal Demographics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.fullName
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.email
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+1 555-0199"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.phoneNumber
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.phoneNumber && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white transition-all ${
                        formErrors.dateOfBirth
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.dateOfBirth}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white transition-all ${
                        formErrors.gender
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {formErrors.gender && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.gender}</p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5 border-b pb-1">
                  <MapPin className="w-4 h-4 text-primary-600" /> Address Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="742 Evergreen Terrace"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Springfield"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="OR"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Postal Code</label>
                    <input
                      type="text"
                      placeholder="97477"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Emergency Contact */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5 border-b pb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.emergencyContactName
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.emergencyContactName && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.emergencyContactName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+1 555-0999"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.emergencyContactPhone
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                    {formErrors.emergencyContactPhone && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Vitals & History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5 border-b pb-1">
                  <Activity className="w-4 h-4 text-emerald-600" /> Vitals & Clinical History
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="175"
                      value={formData.heightCm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          heightCm: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="70"
                      value={formData.weightKg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weightKg: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Allergies
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Penicillin, Peanuts, Latex..."
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Pre-existing Medical Conditions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Hypertension, Asthma, Type 2 Diabetes..."
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Current Medications
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Metformin 500mg, Atorvastatin 20mg..."
                      value={formData.currentMedications}
                      onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Insurance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5 border-b pb-1">
                  <FileText className="w-4 h-4 text-sky-600" /> Insurance Provider
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Insurance Provider Name
                    </label>
                    <input
                      type="text"
                      placeholder="Blue Cross / Aetna"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Policy Number / ID
                    </label>
                    <input
                      type="text"
                      placeholder="POL-99234812"
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={submitting}
                  className="shadow-sm"
                >
                  {editingPatient ? 'Update Patient' : 'Register Patient'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete Patient Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-sm text-slate-600">
              Are you sure you want to delete patient record <strong className="text-slate-900">{patientToDelete.full_name}</strong> ({patientToDelete.patient_code})?
              This will permanently delete their demographic and medical record entry.
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
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                isLoading={deleting}
              >
                Delete Patient
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
