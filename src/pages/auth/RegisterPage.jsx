import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import authService from "../../api/authService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import PasswordInput from "../../components/common/PasswordInput";

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(formData.name, formData.email, formData.password);

      const data = await authService.login(formData.email, formData.password);
      login({ email: data.email, role: data.role, name: data.name }, data.token);

      showToast(t("auth.register.welcome", { name: data.name }), "success");
      const redirect = searchParams.get("redirect");
      navigate(redirect || "/", { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || t("auth.register.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center sm:py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 text-center mb-8">{t("auth.register.subtitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.register.nameLabel")}</label>
            <input id="register-name" type="text" name="name" value={formData.name} onChange={handleChange} required
              autoComplete="name"
              placeholder={t("auth.register.namePlaceholder")}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.register.emailLabel")}</label>
            <input id="register-email" type="email" name="email" value={formData.email} onChange={handleChange} required
              autoComplete="email"
              placeholder={t("auth.register.emailPlaceholder")}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.register.passwordLabel")}</label>
            <PasswordInput id="register-password" name="password" value={formData.password} onChange={handleChange} required
              autoComplete="new-password"
              placeholder={t("auth.register.passwordPlaceholder")} minLength={6}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500 dark:disabled:bg-pink-900 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
            {loading ? t("auth.register.submitting") : t("auth.register.submit")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-slate-400 mt-6">
          {t("auth.register.haveAccount")}{" "}
          <Link to="/login" className="text-pink-700 dark:text-pink-400 hover:underline font-medium">
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
