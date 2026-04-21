import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";

import DashboardIndex from "./pages/dashboard/DashboardIndex";
import ProductsPage from "./pages/dashboard/Products";
import ProductFormPage from "./pages/dashboard/ProductForm";
import ExpensesPage from "./pages/dashboard/Expenses";
import FinancePage from "./pages/dashboard/FinancePage";
import MovementsPage from "./pages/dashboard/MovementsPage";
import CalendarPage from "./pages/dashboard/Calendar";
import UsersPage from "./pages/dashboard/Users";
import SettingsPage from "./pages/dashboard/Settings";

import PlatformOverview from "./pages/dashboard/super/PlatformOverview";
import BusinessesPage from "./pages/dashboard/super/Businesses";
import CreateBusinessPage from "./pages/dashboard/super/CreateBusiness";
import AllUsersPage from "./pages/dashboard/super/AllUsers";
import CreateOwnerPage from "./pages/dashboard/super/CreateOwner";
import GlobalSettingsPage from "./pages/dashboard/super/GlobalSettings";

import NotFound from "./pages/NotFound";
import PublicBookingPage from "./pages/public/PublicBookingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/:businessSlug/turnos" element={<PublicBookingPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardIndex />} />

              <Route
                path="businesses"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <BusinessesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="businesses/new"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <CreateBusinessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="all-users"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AllUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="create-owner"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <CreateOwnerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="global-settings"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <GlobalSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="platform-overview"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <PlatformOverview />
                  </ProtectedRoute>
                }
              />

              <Route
                path="products"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "EDITOR"]}>
                    <ProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products/new"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "EDITOR"]}>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products/:id"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "EDITOR"]}>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="expenses"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                    <FinancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="movements"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                    <MovementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="calendar"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "EDITOR"]}>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={["OWNER"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={["OWNER"]}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;