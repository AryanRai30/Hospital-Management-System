import React, { useEffect, useState, useMemo } from 'react';
import { DoctorService } from '../services/doctor.service';
import { Doctor, Department, CreateDoctorFormData } from '../types/doctor';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAppSelector } from '../hooks/store';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Mail,
  Phone,
  Stethoscope,
  Building2,
  GraduationCap,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Lock
} from 'lucide-react';

const INITIAL_FORM_DATA: CreateDoctorFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  gender: '',
  dateOfBirth: '',
  specialization: '',
  departmentId: '',
  qualification: '',
  experienceYears: '',
  consultationFee: '',
  address: '',
  status: true,
  profilePhoto: ''
};

export const DoctorManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  // State Management
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<CreateDoctorFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Dialog States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch Doctors & Departments
  const fetchData = async (searchParam = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const [doctorsRes, deptsRes] = await Promise.all([
        DoctorService.getDoctors(searchParam),
        DoctorService.getDepartments()
      ]);
      setDoctors(doctorsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load doctors from database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('');
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchData(val);
  };

  // Toast banner timer
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open Add Doctor Modal
  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setActionError(null);
    setIsModalOpen(true);
  };

  // Open Edit Doctor Modal
  const handleOpenEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.full_name || `${doctor.first_name} ${doctor.last_name}`,
      email: doctor.email || '',
      phoneNumber: doctor.phone_number || '',
      gender: doctor.gender || '',
      dateOfBirth: doctor.date_of_birth ? doctor.date_of_birth.split('T')[0] : '',
      specialization: doctor.specialization || '',
      departmentId: doctor.department_id || '',
      qualification: doctor.qualification || '',
      experienceYears: doctor.experience_years !== undefined ? doctor.experience_years : '',
      consultationFee: doctor.consultation_fee !== undefined ? doctor.consultation_fee : '',
      address: doctor.address || '',
      status: Boolean(doctor.is_active),
      profilePhoto: doctor.profile_photo || ''
    });
    setFormErrors({});
    setActionError(null);
    setIsModalOpen(true);
  };

  // Form Field Validation
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

    if (!formData.specialization.trim()) {
      errors.specialization = 'Specialization is required.';
    }

    if (!formData.departmentId) {
      errors.departmentId = 'Department selection is required.';
    }

    if (!formData.qualification.trim()) {
      errors.qualification = 'Qualification is required.';
    }

    if (formData.experienceYears === '' || Number(formData.experienceYears) < 0) {
      errors.experienceYears = 'Experience (years) must be 0 or greater.';
    }

    if (formData.consultationFee === '' || Number(formData.consultationFee) < 0) {
      errors.consultationFee = 'Consultation fee must be 0 or greater.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingDoctor) {
        // Update existing doctor
        await DoctorService.updateDoctor(editingDoctor.id, formData);
        showToast(`Doctor '${formData.fullName}' updated successfully.`);
      } else {
        // Create new doctor
        await DoctorService.createDoctor(formData);
        showToast(`New Doctor '${formData.fullName}' added successfully.`);
      }
      setIsModalOpen(false);
      fetchData(searchQuery);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Operation failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Dialog
  const handleOpenDeleteModal = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Operation
  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;

    setDeleting(true);
    setActionError(null);
    try {
      await DoctorService.deleteDoctor(doctorToDelete.id);
      showToast(`Doctor '${doctorToDelete.full_name}' was deleted successfully.`);
      setIsDeleteModalOpen(false);
      setDoctorToDelete(null);
      fetchData(searchQuery);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to delete doctor.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Filtered doctors list optimization fallback
  const displayedDoctors = useMemo(() => doctors, [doctors]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-bounce-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Management</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              <UserCheck className="w-3.5 h-3.5" /> {doctors.length} Registered
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Directory of active medical specialists, department assignments, and consultation pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(searchQuery)}
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
              Add New Doctor
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Read-only access
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area: Search + Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {/* Search Bar Bar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchData('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 self-start sm:self-center">
            <span>Showing <strong className="text-slate-700">{displayedDoctors.length}</strong> doctors</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => fetchData(searchQuery)}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-9 h-9 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-600">Fetching doctor records from database...</p>
          </div>
        ) : displayedDoctors.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Doctors Found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {searchQuery
                ? `No doctors match the search filter "${searchQuery}".`
                : 'No doctor records exist in the database. Click "Add New Doctor" to get started.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  fetchData('');
                }}
              >
                Clear Search Filter
              </Button>
            )}
          </div>
        ) : (
          /* Responsive Doctors Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Doctor</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Qualification & Exp</th>
                  <th className="py-3.5 px-4">Consultation Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {displayedDoctors.map((doc) => {
                  const isActive = Boolean(doc.is_active);
                  const avatarText = doc.full_name
                    ? doc.full_name.charAt(0).toUpperCase()
                    : `${doc.first_name?.charAt(0) || ''}${doc.last_name?.charAt(0) || ''}`;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Doctor Profile Name */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {doc.profile_photo ? (
                            <img
                              src={doc.profile_photo}
                              alt={doc.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                              {avatarText}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug">
                              Dr. {doc.full_name || `${doc.first_name} ${doc.last_name}`}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {doc.license_number || `ID: #${doc.id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Stethoscope className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span>{doc.specialization}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {doc.department_name || 'General'}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.email}</span>
                          </div>
                          {doc.phone_number && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{doc.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Qualification & Experience */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700">
                          <div className="font-medium flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {doc.qualification}
                          </div>
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {doc.experience_years} years exp.
                          </div>
                        </div>
                      </td>

                      {/* Consultation Fee */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 font-mono text-sm">
                          ${Number(doc.consultation_fee).toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant={isActive ? 'success' : 'neutral'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(doc)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Edit Doctor Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(doc)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Doctor"
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

      {/* Add / Edit Doctor Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-lg">
                  {editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}
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
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Dr. Emily Watson"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.fullName
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.fullName && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="dr.watson@hospital.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.email
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="+1 555-0199"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Specialization <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Cardiologist"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.specialization
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.specialization && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.specialization}</p>
                  )}
                </div>

                {/* Department Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: Number(e.target.value) || '' })
                    }
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white transition-all ${
                      formErrors.departmentId
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  {formErrors.departmentId && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.departmentId}</p>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Qualification <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="MBBS, MD (Cardiology)"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.qualification
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.qualification && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.qualification}</p>
                  )}
                </div>

                {/* Experience (Years) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Experience (Years) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      max="60"
                      placeholder="10"
                      value={formData.experienceYears}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experienceYears: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.experienceYears
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.experienceYears && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.experienceYears}</p>
                  )}
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Consultation Fee ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="150.00"
                      value={formData.consultationFee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultationFee: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        formErrors.consultationFee
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {formErrors.consultationFee && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.consultationFee}</p>
                  )}
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
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

                {/* Profile Photo Placeholder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Profile Photo URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.profilePhoto}
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Address (Full Width) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="Suite 301, Medical Tower, Hospital Complex"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
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
                  {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {isDeleteModalOpen && doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete Doctor Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">Dr. {doctorToDelete.full_name}</strong>?
              This will permanently remove their profile and user account from the system.
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
                Delete Doctor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
