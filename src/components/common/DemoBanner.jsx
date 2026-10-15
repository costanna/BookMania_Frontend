import { useTranslation } from "react-i18next";
import { exitDemo, isDemoChosen } from "../../api/demo";

// Shown on every page while the browser demo is on, so it's never mistaken
// for the real library - with a way back to it.
const DemoBanner = () => {
  const { t } = useTranslation();
  if (!isDemoChosen()) return null;

  return (
    <div role="note" className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-900">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <span>{t("demo.banner")}</span>
        <button type="button" onClick={exitDemo}
          className="font-medium underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded">
          {t("demo.exit")}
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
