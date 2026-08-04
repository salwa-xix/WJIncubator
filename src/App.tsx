import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FullPageSpinner } from "@/components/ui/FullPageSpinner";
import { StartupAuthProvider } from "@/features/auth/StartupAuthProvider";
import { AdminAuthProvider } from "@/features/auth/AdminAuthProvider";
import {
  RedirectIfAdmin,
  RedirectIfStartup,
  RequireAdmin,
  RequireStartup,
} from "@/features/auth/guards";
import StartupLogin from "@/pages/StartupLogin";
import StartupDashboard from "@/pages/StartupDashboard";
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminSession = lazy(() => import("@/pages/admin/AdminSession"));
const AdminMentors = lazy(() => import("@/pages/admin/AdminMentors"));
const AdminSlots = lazy(() => import("@/pages/admin/AdminSlots"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminStartups = lazy(() => import("@/pages/admin/AdminStartups"));
const AdminLayout = lazy(() =>
  import("@/components/layout/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
import NotFound from "@/pages/NotFound";
import { SkipLink } from "@/components/layout/SkipLink";

/**
 * The two audiences are kept entirely separate — separate providers, separate
 * guards, separate entry points, and no navigation between them beyond one
 * discreet link on the admin page. A startup session confers nothing on the
 * admin side and vice versa.
 */
export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <AdminAuthProvider>
        <StartupAuthProvider>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              {/* Startup */}
              <Route
                path="/"
                element={
                  <RedirectIfStartup>
                    <StartupLogin />
                  </RedirectIfStartup>
                }
              />
              <Route element={<RequireStartup />}>
                <Route path="/dashboard" element={<StartupDashboard />} />
              </Route>

              {/* Admin */}
              <Route
                path="/admin/login"
                element={
                  <RedirectIfAdmin>
                    <AdminLogin />
                  </RedirectIfAdmin>
                }
              />
              <Route element={<RequireAdmin />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/session" element={<AdminSession />} />
                  <Route path="/admin/mentors" element={<AdminMentors />} />
                  <Route path="/admin/slots" element={<AdminSlots />} />
                  <Route path="/admin/bookings" element={<AdminBookings />} />
                  <Route path="/admin/startups" element={<AdminStartups />} />
                </Route>
              </Route>

              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </StartupAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
