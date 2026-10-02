import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClinicProvider } from './context/ClinicContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminPage } from './pages/AdminPage';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { DashboardPage } from './pages/DashboardPage';
import { QueuePage } from './pages/QueuePage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { PatientsPage } from './pages/PatientsPage';
import { ConsultationPage } from './pages/ConsultationPage';
import { WaitingRoomDisplayPage } from './pages/WaitingRoomDisplayPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const STAFF_ROLES = ['Admin', 'Receptionist', 'Doctor'];

/**
 * Protected Route wrapper that verifies authentication & allowed roles
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, role, getRoleHomeRoute } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Verifying authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user to their own role-designated home
    const userHome = getRoleHomeRoute(role);
    return <Navigate to={userHome} replace />;
  }

  return children;
}

/**
 * Root Home Redirection based on authenticated role
 */
function RoleHomeRedirect() {
  const { role } = useAuth();

  switch (role) {
    case 'Admin':
      return <Navigate to="/admin" replace />;
    case 'Doctor':
      return <Navigate to="/consultation" replace />;
    case 'Patient':
      return <Navigate to="/patient-portal" replace />;
    case 'Receptionist':
    default:
      return <DashboardPage />;
  }
}

export function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <BrowserRouter>
          {/* Global Toast Provider */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              className: 'text-sm font-medium rounded-xl shadow-soft-md border border-slate-200/90 text-slate-800 bg-white',
              success: {
                iconTheme: {
                  primary: '#0d9488',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#e11d48',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Full-Screen Waiting Room TV Display (No sidebar) */}
            <Route path="/display" element={<WaitingRoomDisplayPage />} />
            <Route path="/waiting-room" element={<WaitingRoomDisplayPage />} />

            {/* Authenticated Layout with Role-based Sidebar & TopBar */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Home Page: Automatically redirects each role to its own home page */}
              <Route index element={<RoleHomeRedirect />} />

              {/* Admin Console (Staff creation & system oversight) */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Patient Portal (Personal appointments, prescriptions & receipts) */}
              <Route
                path="patient-portal"
                element={
                  <ProtectedRoute allowedRoles={['Patient']}>
                    <PatientPortalPage />
                  </ProtectedRoute>
                }
              />

              {/* Receptionist / Admin Operations Dashboard */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Consultation Desk */}
              <Route
                path="consultation"
                element={
                  <ProtectedRoute allowedRoles={['Doctor', 'Receptionist', 'Admin']}>
                    <ConsultationPage />
                  </ProtectedRoute>
                }
              />

              {/* Clinic Modules */}
              <Route
                path="queue"
                element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES}>
                    <QueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="appointments"
                element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES}>
                    <AppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="doctors"
                element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES}>
                    <DoctorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="patients"
                element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES}>
                    <PatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="design-system" element={<DesignSystemPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ClinicProvider>
    </AuthProvider>
  );
}

export default App;
