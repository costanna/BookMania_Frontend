import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import Layout from "../components/layout/Layout";
import ToastProvider from "../context/ToastProvider";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const BooksPage = lazy(() => import("../pages/books/BooksPage"));
const BookDetailPage = lazy(() => import("../pages/books/BookDetailPage"));
const MyLoansPage = lazy(() => import("../pages/loans/MyLoansPage"));
const MyFinesPage = lazy(() => import("../pages/fines/MyFinesPage"));
const MyReservationsPage = lazy(() => import("../pages/reservations/MyReservationsPage"));
const AccountPage = lazy(() => import("../pages/account/AccountPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const PageFallback = () => (
  <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
    <p className="text-pink-700">Cargando...</p>
  </div>
);

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated()
    ? children
    : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
};

export const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const admin = isAdmin();

  // showToast can't be called during render (it updates ToastProvider's
  // state while this component is rendering) — it has to happen as an
  // effect, and only once per denied visit rather than on every re-render.
  useEffect(() => {
    if (!admin) {
      showToast("No tienes permisos de administrador", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount/permission change, not on every showToast identity change
  }, [admin]);

  return admin ? children : <Navigate to="/" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<BooksPage />} />
              <Route path="/books/:id" element={<BookDetailPage />} />
              <Route path="/my-loans" element={<PrivateRoute><MyLoansPage /></PrivateRoute>} />
              <Route path="/my-fines" element={<PrivateRoute><MyFinesPage /></PrivateRoute>} />
              <Route path="/my-reservations" element={<PrivateRoute><MyReservationsPage /></PrivateRoute>} />
              <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
