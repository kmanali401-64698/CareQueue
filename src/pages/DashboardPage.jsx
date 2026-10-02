import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  UserX,
  IndianRupee,
  Stethoscope,
  MonitorPlay,
  Plus,
  Printer,
  Receipt,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import {
  PageHeader,
  Button,
  Card,
  Badge,
  TokenBadge,
  StatCard,
  ResponsiveTable
} from '../components/ui';
import { PrintableReceipt } from '../components/clinical/PrintableReceipt';
import { CollectPaymentModal } from '../components/clinical/CollectPaymentModal';
import { formatRs } from '../utils/currency';

export function DashboardPage() {
  const { 
    doctors, 
    appointments, 
    receipts, 
    getTodayStats, 
    getDoctorQueueData
  } = useClinic();

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const stats = getTodayStats();
  const unpaidAppointments = appointments.filter(
    (a) => a.billingStatus === 'Unpaid' && !['Cancelled', 'NoShow'].includes(a.status)
  );

  // Payment collected in the modal: show the printable receipt
  const handlePaid = (receipt) => {
    setPaymentAppointment(null);
    setSelectedReceipt(receipt);
  };

  // Doctors Queue Status Columns
  const doctorQueueColumns = [
    {
      header: 'Doctor / Physician',
      accessor: 'name',
      primaryMobile: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-soft-xs">
            {row.avatar}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{row.name}</span>
            <span className="text-xs text-slate-500">{row.specialty}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Room',
      accessor: 'room',
      render: (room) => (
        <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
          {room}
        </span>
      ),
    },
    {
      header: 'Duty Status',
      accessor: 'id',
      render: (id) => {
        const qData = getDoctorQueueData(id);
        if (qData.isOnLeave) return <Badge status="NoShow">On Leave</Badge>;
        if (qData.nowServing) return <Badge status="InConsultation">In Consultation</Badge>;
        return <Badge variant="green">On Duty</Badge>;
      },
    },
    {
      header: 'Now Serving',
      accessor: 'id',
      render: (id) => {
        const qData = getDoctorQueueData(id);
        if (qData.isOnLeave) return <span className="text-xs text-rose-500 italic">No slots today</span>;
        if (!qData.nowServing) return <span className="text-xs text-slate-400 italic">Station standby</span>;

        return (
          <div className="flex items-center gap-2">
            <TokenBadge token={qData.nowServing.token} size="sm" />
            <span className="text-xs font-bold text-slate-900">{qData.nowServing.patientName}</span>
          </div>
        );
      },
    },
    {
      header: 'Waiting Queue',
      accessor: 'id',
      render: (id) => {
        const qData = getDoctorQueueData(id);
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {qData.waitingCount} Waiting
          </span>
        );
      },
    },
    {
      header: 'Completed Today',
      accessor: 'id',
      render: (id) => {
        const qData = getDoctorQueueData(id);
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {qData.completedCount} Done
          </span>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'right',
      render: () => (
        <Link to="/consultation">
          <Button size="sm" variant="outline">
            Open Room
          </Button>
        </Link>
      ),
    },
  ];

  // Recent Receipts & Billing Columns
  const receiptColumns = [
    {
      header: 'Receipt No',
      accessor: 'receiptNumber',
      primaryMobile: true,
      render: (no) => <span className="font-mono font-bold text-brand-800 text-xs">{no}</span>,
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      render: (name, row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.patientPhone}</span>
        </div>
      ),
    },
    {
      header: 'Consulting Doctor',
      accessor: 'doctorName',
      render: (doc, row) => (
        <div>
          <span className="font-medium text-slate-800 text-xs">{doc}</span>
          <span className="block text-[11px] text-slate-400">{row.room}</span>
        </div>
      ),
    },
    {
      header: 'Amount Paid',
      accessor: 'total',
      render: (amt, row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-sm">{formatRs(amt, 2)}</span>
          <span className="block text-[10px] text-emerald-700 font-medium">{row.paymentMethod}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <Badge status="Paid" size="sm" />,
    },
    {
      header: 'Official Receipt',
      accessor: 'receiptNumber',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          icon={Printer}
          onClick={() => setSelectedReceipt(row)}
        >
          Print Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Receptionist Operations Dashboard"
        subtitle="Live clinic waiting line, doctor station rosters, revenue collection, and official receipt printing."
        breadcrumbs={['CareQueue', 'Front Desk', 'Dashboard']}
        badge={<Badge variant="teal">Clinic Open • OPD Active</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/display" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" icon={MonitorPlay}>
                Launch TV Waiting Room Display
              </Button>
            </Link>
            <Button
              variant="outline"
              icon={Printer}
              onClick={() => setSelectedReceipt(receipts[0])}
              disabled={receipts.length === 0}
            >
              Print Latest Receipt
            </Button>
            <Link to="/appointments">
              <Button variant="outline" icon={Plus}>
                Book Appointment
              </Button>
            </Link>
          </div>
        }
      />


      {/* 5 MANDATORY KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Today's Appointments */}
        <StatCard
          title="Today's Appointments"
          value={stats.totalAppointments.toString()}
          icon={Calendar}
          iconColor="blue"
          badgeText="Booked Today"
          trend={{ value: `${stats.booked} yet to arrive`, isPositive: true }}
        />

        {/* 2. Checked In */}
        <StatCard
          title="Checked In (Waiting)"
          value={stats.checkedIn.toString()}
          icon={Clock}
          iconColor="amber"
          badgeText="In Waiting Room"
          trend={{ value: `${stats.inConsultation} in consult`, isPositive: true }}
        />

        {/* 3. Completed */}
        <StatCard
          title="Completed Today"
          value={stats.completed.toString()}
          icon={CheckCircle2}
          iconColor="emerald"
          badgeText="Discharged"
          trend={{ value: `${stats.completed} of ${stats.totalAppointments}`, isPositive: true }}
        />

        {/* 4. No-Shows */}
        <StatCard
          title="No-Shows Today"
          value={stats.noShows.toString()}
          icon={UserX}
          iconColor="rose"
          badgeText="Missed Slot"
          trend={{ value: 'Needs follow-up', isPositive: false }}
        />

        {/* 5. Today's Collected Revenue */}
        <StatCard
          title="Today's Revenue"
          value={formatRs(stats.collectedRevenue)}
          icon={IndianRupee}
          iconColor="teal"
          badgeText={`${stats.paidCount} Paid Invoices`}
          trend={{ value: `${unpaidAppointments.length} unpaid`, isPositive: unpaidAppointments.length === 0 }}
        />
      </div>

      {/* MANDATORY TABLE: Each Doctor's Queue Status */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              Doctor OPD Queue & Station Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation tracking, active token announcements, and waiting line counts per physician.
            </p>
          </div>

          <Link to="/display" className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
            Open Waiting Room Display <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ResponsiveTable
          columns={doctorQueueColumns}
          data={doctors}
        />
      </Card>

      {/* Unpaid Appointments & Printable Receipts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pending Invoices to Collect (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Pending Invoice Collections
                </h3>
              </div>
              <Badge status="Unpaid">
                {unpaidAppointments.length} Unpaid
              </Badge>
            </div>

            <p className="text-xs text-slate-500">
              Collect consultation fees at front desk to issue official tax invoice receipts.
            </p>

            <div className="space-y-3 pt-2">
              {unpaidAppointments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">All consultation fees are settled.</p>
              )}
              {unpaidAppointments
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <TokenBadge token={apt.token} size="sm" />
                        <span className="font-bold text-slate-900">{apt.patientName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {apt.doctorName} • Basic fee: <strong className="font-mono text-slate-800">{formatRs(apt.fee)}</strong>
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setPaymentAppointment(apt)}
                    >
                      Collect Payment
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Today's Official Settled Receipts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="none">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  Recent Settled Receipts & Invoices
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Print official clinic receipts sharing the exact same header as medical prescriptions.
                </p>
              </div>

              <Badge variant="teal">{receipts.length} Receipts Issued</Badge>
            </div>

            <ResponsiveTable
              columns={receiptColumns}
              data={receipts}
            />
          </Card>
        </div>
      </div>

      {/* Collect Payment (basic fee + patient-specific charges / discount) */}
      {paymentAppointment && (
        <CollectPaymentModal
          appointment={paymentAppointment}
          onClose={() => setPaymentAppointment(null)}
          onPaid={handlePaid}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <PrintableReceipt
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
