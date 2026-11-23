import { useTranslation } from "react-i18next";
import { startDemo } from "../../api/demo";

export const demoButtonClass = "border border-pink-200 dark:border-slate-600 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 font-medium rounded-lg py-2 px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600";

// "Just want a look?" invitation shown on the login and register screens.
// Starting the demo goes to the login screen, where the demo users are offered.
const TryDemo = () => {
  const { t } = useTranslation();

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-slate-400">{t("demo.login.title")}</p>
      <button type="button" onClick={startDemo} className={`${demoButtonClass} mt-3 px-6`}>
        {t("demo.try")}
      </button>
      <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">{t("demo.login.hint")}</p>
    </>
  );
};

export default TryDemo;
