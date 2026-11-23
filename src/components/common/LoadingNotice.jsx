import { useTranslation } from "react-i18next";

// A skeleton alone (animate-pulse gray bars) reads as "loading" only to
// people already used to that convention - on Render's free tier the
// backend can be asleep and take 30-60s to wake up on the first request of
// the session, and a silent skeleton for that long looks broken rather than
// busy. This pairs the same pulse language with an explicit, spoken-out-loud
// message so it's unambiguous either way.
const Spinner = (props) => (
  <svg viewBox="0 0 24 24" fill="none" className="animate-spin" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const LoadingNotice = ({ message, className = "" }) => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite"
      className={`flex items-center gap-2 text-pink-700 dark:text-pink-400 text-sm ${className}`}>
      <Spinner className="w-4 h-4 shrink-0" />
      <span>{message || t("common.loading")}</span>
    </div>
  );
};

export default LoadingNotice;
