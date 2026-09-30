import { useTranslation } from "react-i18next";

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }) => {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const pageItems = Array.from({ length: totalPages }, (_, i) => i)
    .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1)
    .reduce((acc, i, idx, arr) => {
      if (idx > 0 && i - arr[idx - 1] > 1) acc.push("...");
      acc.push(i);
      return acc;
    }, []);

  return (
    <nav aria-label={t("pagination.nav")} className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onPageChange(0)} disabled={disabled || currentPage === 0}
        aria-label={t("pagination.first")}
        className="px-3 py-2 text-sm rounded-xl border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">«</button>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={disabled || currentPage === 0}
        aria-label={t("pagination.previous")}
        className="px-4 py-2 text-sm rounded-xl border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">{t("pagination.previousText")}</button>

      {pageItems.map((item, idx) =>
        item === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-gray-600 dark:text-slate-300" aria-hidden="true">...</span>
        ) : (
          <button key={item} onClick={() => onPageChange(item)} disabled={disabled}
            aria-label={t("pagination.page", { page: item + 1 })}
            aria-current={currentPage === item ? "page" : undefined}
            className={`px-4 py-2 text-sm rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${currentPage === item
              ? "bg-pink-700 dark:bg-pink-600 text-white font-medium"
              : "border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800"}`}>
            {item + 1}
          </button>
        )
      )}

      <button onClick={() => onPageChange(currentPage + 1)} disabled={disabled || currentPage === totalPages - 1}
        aria-label={t("pagination.next")}
        className="px-4 py-2 text-sm rounded-xl border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">{t("pagination.nextText")}</button>
      <button onClick={() => onPageChange(totalPages - 1)} disabled={disabled || currentPage === totalPages - 1}
        aria-label={t("pagination.last")}
        className="px-3 py-2 text-sm rounded-xl border border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">»</button>
    </nav>
  );
};

export default Pagination;
