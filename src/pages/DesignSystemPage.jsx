import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Palette,
  AlertCircle,
  Sparkles,
  Clock,
  Users,
  CreditCard,
  Send
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  Badge,
  TokenBadge,
  StatCard,
  PageHeader,
  EmptyState,
  Modal,
  FormField,
  Input,
  Textarea,
  LoadingSpinner,
  Skeleton,
  TableSkeleton,
  ResponsiveTable
} from '../components/ui';

export function DesignSystemPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formError] = useState('This field is required according to UI rules');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const simulateFormSubmit = (e) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    setTimeout(() => {
      setIsFormSubmitting(false);
      toast.success('Form submitted successfully!');
    }, 1500);
  };

  // Demo table data for responsive test
  const demoTableColumns = [
    {
      header: 'Token Pill',
      accessor: 'token',
      primaryMobile: true,
      render: (t) => <TokenBadge token={t} size="sm" />,
    },
    {
      header: 'Patient Name',
      accessor: 'name',
    },
    {
      header: 'Assigned Clinic',
      accessor: 'clinic',
    },
    {
      header: 'Status Badge',
      accessor: 'status',
      render: (s) => <Badge status={s} />,
    },
    {
      header: 'Payment Status',
      accessor: 'payment',
      render: (p) => <Badge status={p} size="sm" withDot={false} />,
    },
  ];

  const demoTableData = [
    { id: 1, token: 'D1-07', name: 'Alice Jenkins', clinic: 'General Medicine', status: 'Booked', payment: 'Unpaid' },
    { id: 2, token: 'D1-08', name: 'Brian O\'Connor', clinic: 'General Medicine', status: 'CheckedIn', payment: 'Unpaid' },
    { id: 3, token: 'D2-04', name: 'Carlos Mendez', clinic: 'Pediatrics', status: 'InConsultation', payment: 'Unpaid' },
    { id: 4, token: 'D1-06', name: 'Diana Ross', clinic: 'General Medicine', status: 'Completed', payment: 'Paid' },
    { id: 5, token: 'D2-05', name: 'Edward Norton', clinic: 'Pediatrics', status: 'NoShow', payment: 'Cancelled' },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <PageHeader
        title="UI Design System & Component Library"
        subtitle="Mandatory UI specifications, reusable components, and visual rules for CareQueue."
        breadcrumbs={['CareQueue', 'System Documentation', 'UI Rules']}
        badge={<Badge variant="teal">CareQueue Standard v1.0</Badge>}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={Sparkles}
              onClick={() => {
                toast.success('System UI rules active across all pages');
              }}
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="danger"
              icon={AlertCircle}
              onClick={() => {
                toast.error('Simulation: Action failed or validation error');
              }}
            >
              Trigger Error Toast
            </Button>
          </div>
        }
      />

      {/* Mandatory Rules Banner */}
      <div className="bg-brand-50 border border-brand-200/90 rounded-xl p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-600 text-white rounded-lg shrink-0 mt-0.5">
            <Palette className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-sm text-brand-950">
            <h3 className="font-semibold text-base text-brand-900">
              CareQueue Global UI Directives
            </h3>
            <p className="text-brand-800/90 text-xs sm:text-sm leading-relaxed">
              Every page in this project follows these rules strictly: Primary teal (<code className="font-mono bg-brand-100 px-1.5 py-0.5 rounded text-brand-900">#0d9488</code>), light grey background (<code className="font-mono bg-brand-100 px-1.5 py-0.5 rounded text-brand-900">#f8fafc</code>), white cards with <code className="font-mono bg-brand-100 px-1.5 py-0.5 rounded text-brand-900">rounded-xl</code> corners, Inter typography, consistent status badge colors, large token pills, mobile-responsive tables, empty states, loading skeletons, and toast feedback for all actions.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Strict Status Badges Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">1. Status Badge Color System</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Strictly assigned colors for all clinic states. Never use custom colors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { status: 'Booked', color: 'Blue (#1d4ed8)', desc: 'Future scheduled appointment' },
            { status: 'CheckedIn', color: 'Amber (#b45309)', desc: 'Patient arrived in clinic' },
            { status: 'InConsultation', color: 'Purple (#7e22ce)', desc: 'Currently with doctor' },
            { status: 'Completed', color: 'Green (#15803d)', desc: 'Visit finished & discharged' },
            { status: 'NoShow', color: 'Red (#b91c1c)', desc: 'Missed scheduled time' },
            { status: 'Cancelled', color: 'Grey (#64748b)', desc: 'Slot voided / cancelled' },
            { status: 'Unpaid', color: 'Orange (#c2410c)', desc: 'Billing payment pending' },
            { status: 'Paid', color: 'Green (#15803d)', desc: 'Payment settled & closed' },
          ].map((item) => (
            <Card key={item.status} padding="sm" className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge status={item.status} />
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Target: <span className="text-slate-700 font-semibold">{item.color}</span>
              </div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Tokens Presentation */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">2. Queue Tokens Presentation</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tokens shown as large bold pills (e.g. D1-07, T-102) with high contrast for clinic queues.
          </p>
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-slate-400">Small Pill:</span>
              <TokenBadge token="D1-07" size="sm" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-slate-400">Standard / Medium Pill:</span>
              <TokenBadge token="D1-07" size="md" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-slate-400">Large Calling Display:</span>
              <TokenBadge token="D1-07" size="lg" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-slate-400">Dark High-Contrast:</span>
              <TokenBadge token="A-102" size="md" variant="dark" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-slate-400">Slate Neutral:</span>
              <TokenBadge token="EM-01" size="md" variant="slate" />
            </div>
          </div>
        </Card>
      </section>

      {/* Section 3: Reusable Button Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">3. Reusable Button Component</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Consistent button variants with teal primary, loading spinners, and disabled states.
          </p>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Teal</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button
              variant="primary"
              isLoading={buttonLoading}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 1200);
              }}
            >
              {buttonLoading ? 'Saving...' : 'Click for Loading State'}
            </Button>
            <Button variant="primary" disabled>
              Disabled Button
            </Button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Sizes:</span>
            <Button size="sm" variant="outline">Small (sm)</Button>
            <Button size="md" variant="outline">Medium (md)</Button>
            <Button size="lg" variant="outline">Large (lg)</Button>
          </div>
        </Card>
      </section>

      {/* Section 4: StatCard Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">4. StatCard Component (KPIs)</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Modern metric cards with icon badges, trends, and clean typography.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Check-Ins"
            value="42"
            icon={Users}
            iconColor="teal"
            trend={{ value: '+12%', isPositive: true, label: 'vs last week' }}
          />
          <StatCard
            title="Avg Wait Duration"
            value="14 min"
            icon={Clock}
            iconColor="amber"
            trend={{ value: '-2 min', isPositive: true, label: 'improved' }}
          />
          <StatCard
            title="Unsettled Invoices"
            value="Rs. 1,240"
            icon={CreditCard}
            iconColor="rose"
            trend={{ value: '3 unpaid', isPositive: false, label: 'needs follow-up' }}
          />
        </div>
      </section>

      {/* Section 5: Responsive Table to Mobile Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">5. Responsive Table vs Mobile Cards</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tables on desktop automatically transform into structured card stacks on mobile devices.
          </p>
        </div>

        <Card padding="none">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Resize browser below 768px (md breakpoint) to observe table morphing into cards.</span>
            <Badge variant="teal">Responsive Ready</Badge>
          </div>
          <ResponsiveTable
            columns={demoTableColumns}
            data={demoTableData}
          />
        </Card>
      </section>

      {/* Section 6: Forms Standards (Labels, Validation, Disabled) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">6. Form Guidelines & Validation</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Labels, error feedback messages, and disabled submit buttons while processing.
          </p>
        </div>

        <Card>
          <form onSubmit={simulateFormSubmit} className="space-y-4 max-w-xl">
            <FormField
              label="Patient Full Name"
              id="demo-name"
              required
              error={!formName.trim() ? formError : null}
              helperText="Enter at least first and last name"
            >
              <Input
                id="demo-name"
                placeholder="e.g. John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                error={!formName.trim() ? formError : null}
                disabled={isFormSubmitting}
              />
            </FormField>

            <FormField
              label="Appointment Reason"
              id="demo-reason"
              helperText="Optional chief complaints"
            >
              <Textarea
                id="demo-reason"
                placeholder="Describe clinical symptoms or inquiry..."
                rows={2}
                disabled={isFormSubmitting}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isFormSubmitting}
                disabled={isFormSubmitting}
              >
                {isFormSubmitting ? 'Processing...' : 'Submit Form'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormName('Sarah Connor')}
                disabled={isFormSubmitting}
              >
                Fill Valid Value
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Section 7: Empty State & Loading State */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">7. Empty States & Skeletons</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every list has an empty state; every data load shows a skeleton or spinner.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Empty State Component */}
          <Card>
            <CardHeader title="Empty State Component (Lists/Tables)" />
            <EmptyState
              icon={Users}
              title="No appointments scheduled"
              description="There are no patients queued for this time slot. Use the button below to add one."
              action={
                <Button size="sm" variant="primary" icon={Send} onClick={() => toast.success('Action triggered')}>
                  Schedule Appointment
                </Button>
              }
            />
          </Card>

          {/* Skeleton Loaders */}
          <Card>
            <CardHeader title="Skeleton Loading Indicators" subtitle="Displays while asynchronous data loads" />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <TableSkeleton cols={3} rows={2} />
              <LoadingSpinner size="sm" message="Syncing with clinic server..." />
            </div>
          </Card>
        </div>
      </section>

      {/* Section 8: Modal Dialog Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">8. Accessible Modal Component</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Centred dialog with backdrop blur, rounded-xl corners, and keyboard Escape listener.
          </p>
        </div>

        <Card>
          <p className="text-sm text-slate-600 mb-4">
            Test the CareQueue Modal dialog component:
          </p>
          <Button variant="primary" onClick={() => setIsDemoModalOpen(true)}>
            Open Demo Modal
          </Button>

          <Modal
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
            title="Patient Clinical Note"
            description="Review consultation notes and prescribe prescription."
            footer={
              <>
                <Button variant="outline" onClick={() => setIsDemoModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDemoModalOpen(false);
                    toast.success('Notes saved to patient file');
                  }}
                >
                  Save & Approve
                </Button>
              </>
            }
          >
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                This modal follows all CareQueue visual guidelines: soft backdrop blur, rounded-xl borders, header with close action, and standardized footer actions.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Token D1-07:</span> Emma Watson (Dr. Sarah Chen)
              </div>
            </div>
          </Modal>
        </Card>
      </section>
    </div>
  );
}

export default DesignSystemPage;
