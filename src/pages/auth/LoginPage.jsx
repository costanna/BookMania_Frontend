import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import authService from "../../api/authService";
import useToast from "../../hooks/useToast";
import PasswordInput from "../../components/common/PasswordInput";

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // A 401 elsewhere in the app (expired/invalid token) sets this flag right
  // before redirecting here, so the reason for landing back on the login
  // screen isn't a silent mystery.
  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      sessionStorage.removeItem("session_expired");
      showToast(t("auth.login.sessionExpired"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(formData.email, formData.password);
      login({ email: data.email, role: data.role, name: data.name }, data.token);
      showToast(t("auth.login.welcome", { name: data.name }), "success");
      const redirect = searchParams.get("redirect");
      navigate(redirect || "/", { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || t("auth.login.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center sm:py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 text-center mb-8">{t("auth.login.subtitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.login.emailLabel")}</label>
            <input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} required
              autoComplete="email"
              placeholder={t("auth.login.emailPlaceholder")}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.login.passwordLabel")}</label>
            <PasswordInput id="login-password" name="password" value={formData.password} onChange={handleChange} required
              autoComplete="current-password"
              placeholder={t("auth.login.passwordPlaceholder")}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500 dark:disabled:bg-pink-900 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-slate-400 mt-6">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="text-pink-700 dark:text-pink-400 hover:underline font-medium">
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
