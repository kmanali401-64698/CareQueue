import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Clock,
  CheckCircle2,
  Stethoscope,
  Plus,
  RotateCw,
  Volume2,
  Filter
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { todayISO } from '../utils/date';
import { 
  Button, 
  Card, 
  Badge, 
  TokenBadge, 
  StatCard, 
  PageHeader, 
  EmptyState, 
  Modal, 
  FormField,  
  Select, 
  ResponsiveTable 
} from '../components/ui';

export function QueuePage() {
  const { doctors, patients, appointments, updateAppointmentStatus, bookAppointment, refresh } = useClinic();

  // Persist a queue status change and report the outcome
  const changeStatus = async (id, status, successMessage) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment');
    }
  };

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Form states with validation
  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today's queue only (past/future bookings live on the Appointments page)
  const todaysQueue = appointments.filter((item) => item.date === todayISO() && item.status !== 'Cancelled');
  const filteredQueue = todaysQueue.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  // Average current wait of checked-in patients (only those with a recorded check-in time)
  const waitingTimes = todaysQueue
    .filter((a) => a.status === 'CheckedIn' && a.checkedInAt)
    .map((a) => (Date.now() - new Date(a.checkedInAt).getTime()) / 60000);
  const avgWaitMinutes = waitingTimes.length
    ? Math.round(waitingTimes.reduce((sum, m) => sum + m, 0) / waitingTimes.length)
    : null;

  // Action: Call Next Token
  const handleCallNext = (token, patient) => {
    toast.success(`Calling Token ${token} (${patient}) to Consulting Room`, {
      icon: '📢',
    });
  };

  // Action: Reload queue from the server
  const handleReload = async () => {
    setIsLoadingState(true);
    await refresh();
    setIsLoadingState(false);
    toast.success('Queue data refreshed from clinic server');
  };

  const handleOpenWalkIn = () => {
    setFormData({ patientId: patients[0]?.id || '', doctorId: doctors[0]?.id || '' });
    setIsModalOpen(true);
  };

  // Form Submit with validation
  const handleSubmitWalkIn = async (e) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === formData.doctorId);
    const pat = patients.find((p) => p.id === formData.patientId);
    if (!doc || !pat) {
      toast.error('Select a registered patient and a doctor');
      return;
    }

    setIsSubmitting(true);
    try {
      const newApt = await bookAppointment({
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        date: todayISO(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      });
      await updateAppointmentStatus(newApt.id, 'CheckedIn');
      setIsModalOpen(false);
      toast.success(`Token ${newApt.token} issued for ${newApt.patientName}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to issue token');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Columns for ResponsiveTable
  const columns = [
    {
      header: 'Queue Token',
      accessor: 'token',
      primaryMobile: true,
      render: (token) => <TokenBadge token={token} size="md" />,
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      render: (name, row) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-400">ID: {row.patientId}</div>
        </div>
      ),
    },
    {
      header: 'Doctor / Room',
      accessor: 'doctorName',
      render: (doc, row) => (
        <div>
          <span className="font-medium text-slate-800">{doc}</span>
          <span className="block text-xs text-slate-400">{row.room}</span>
        </div>
      ),
    },
    {
      header: 'Arrival Time',
      accessor: 'time',
      render: (time) => <span className="text-slate-600 font-mono text-xs">{time}</span>,
    },
    {
      header: 'Visit Status',
      accessor: 'status',
      render: (status) => <Badge status={status} />,
    },
    {
      header: 'Billing',
      accessor: 'billingStatus',
      render: (billing) => <Badge status={billing} size="sm" withDot={false} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === 'CheckedIn' && (
            <Button
              size="sm"
              variant="primary"
              icon={Volume2}
              onClick={() => handleCallNext(row.token, row.patientName)}
            >
              Call
            </Button>
          )}
          {row.status === 'CheckedIn' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeStatus(id, 'InConsultation', `Consultation started for ${row.patientName}`)}
            >
              Start Visit
            </Button>
          )}
          {row.status === 'InConsultation' && (
            <Link to={`/consultation?appointment=${id}`}>
              <Button size="sm" variant="primary">
                Diagnosis & Prescription
              </Button>
            </Link>
          )}
          {row.status === 'Completed' && (
            <span className="text-xs text-emerald-600 font-medium">Discharged</span>
          )}
          {row.status === 'Booked' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeStatus(id, 'CheckedIn', `${row.patientName} checked into queue!`)}
            >
              Check In
            </Button>
          )}
          {['Booked', 'CheckedIn'].includes(row.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => changeStatus(id, 'NoShow', `${row.token} marked as no-show`)}
            >
              No Show
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Live Patient Queue & Clinic Flow"
        subtitle="Real-time waiting line, token allocation, doctor OPD tracking, and consultation status."
        breadcrumbs={['CareQueue', 'Front Desk', 'Active Queue']}
        badge={<Badge variant="teal">OPD Active</Badge>}
        actions={
          <>
            <Button
              variant="outline"
              icon={RotateCw}
              onClick={handleReload}
              isLoading={isLoadingState}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenWalkIn}
            >
              Check In Patient
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Waiting in Queue"
          value={todaysQueue.filter((q) => q.status === 'CheckedIn').length.toString()}
          icon={Clock}
          iconColor="amber"
          badgeText="Active Waiting"
        />
        <StatCard
          title="In Consultation"
          value={todaysQueue.filter((q) => q.status === 'InConsultation').length.toString()}
          icon={Stethoscope}
          iconColor="purple"
          subtitle="Doctors active in OPDs"
        />
        <StatCard
          title="Completed Today"
          value={todaysQueue.filter((q) => q.status === 'Completed').length.toString()}
          icon={CheckCircle2}
          iconColor="emerald"
          subtitle={`${todaysQueue.length} on today's list`}
        />
        <StatCard
          title="Avg Wait Time"
          value={avgWaitMinutes === null ? '—' : `${avgWaitMinutes} min`}
          icon={Users}
          iconColor="teal"
          subtitle="Current wait of checked-in patients"
        />
      </div>

      {/* Main Queue Card with Filter & Responsive Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter Status:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'CheckedIn', 'InConsultation', 'Booked', 'Completed'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  statusFilter === statusKey
                    ? 'bg-brand-600 text-white shadow-soft-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {statusKey === 'ALL' ? 'All Patients' : statusKey}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveTable
          columns={columns}
          data={filteredQueue}
          isLoading={isLoadingState}
          emptyState={
            <div className="p-8">
              <EmptyState
                icon={Users}
                title={`No patients currently in "${statusFilter}" status`}
                description="Patients will appear here automatically when checked in or assigned."
                action={
                  <Button variant="outline" size="sm" onClick={() => setStatusFilter('ALL')}>
                    Reset Filter
                  </Button>
                }
              />
            </div>
          }
        />
      </Card>

      {/* Quick Check-in Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Check-In Patient & Issue Token"
        description="Select an existing seeded patient or register a walk-in to generate a token."
        footer={
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmitWalkIn}
            >
              Generate Token & Check In
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitWalkIn} className="space-y-4">
          <FormField
            label="Registered Patient"
            id="checkin-patient"
            helperText={<>New patient? Register them first in the <Link to="/patients" className="text-brand-700 font-semibold underline">Patient Directory</Link>.</>}
          >
            <Select
              id="checkin-patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              disabled={isSubmitting}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gender}, {p.age}y) - {p.phone}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Assigned Doctor" id="checkin-doctor">
            <Select
              id="checkin-doctor"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              disabled={isSubmitting}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty}, {d.room})
                </option>
              ))}
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default QueuePage;
