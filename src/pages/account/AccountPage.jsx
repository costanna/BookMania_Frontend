import { useState } from "react";
import { useTranslation } from "react-i18next";
import userService from "../../api/userService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import PasswordInput from "../../components/common/PasswordInput";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

const AccountPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showToast(t("account.password.mismatch"), "error");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(formData.currentPassword, formData.newPassword);
      showToast(t("account.password.success"), "success");
      setFormData(EMPTY_FORM);
    } catch (err) {
      showToast(err.response?.data?.message || t("account.password.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 mb-2">{t("account.title")}</h1>
      <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
        {t("account.subtitle", { name: user?.name })}
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-pink-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-pink-700 dark:text-pink-400 mb-4">
          {t("account.password.title")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="account-current-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t("account.password.currentLabel")}
            </label>
            <PasswordInput id="account-current-password" name="currentPassword" value={formData.currentPassword}
              onChange={handleChange} required autoComplete="current-password" placeholder={t("account.password.currentPlaceholder")}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="account-new-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t("account.password.newLabel")}
            </label>
            <PasswordInput id="account-new-password" name="newPassword" value={formData.newPassword}
              onChange={handleChange} required autoComplete="new-password" placeholder={t("account.password.newPlaceholder")} minLength={6}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t("account.password.confirmLabel")}
            </label>
            <PasswordInput id="account-confirm-password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} required autoComplete="new-password" placeholder={t("account.password.confirmPlaceholder")} minLength={6}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500 dark:disabled:bg-pink-900 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
            {loading ? t("account.password.submitting") : t("account.password.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
