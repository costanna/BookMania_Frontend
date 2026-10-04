import { useState } from "react";
import { useTranslation } from "react-i18next";

const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19M6.61 6.61A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M2 2l20 20" />
  </svg>
);

// Drop-in replacement for <input type="password"> with a show/hide toggle.
// Every prop goes straight to the <input> (id, name, value, autoComplete…),
// so the field's <label htmlFor> keeps pointing at the input itself, not at
// a wrapper.
const PasswordInput = ({ className = "", ...props }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-11`} />
      <button type="button" onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex items-center px-3 rounded-r-lg text-gray-500 hover:text-pink-700 dark:text-slate-400 dark:hover:text-pink-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600">
        {visible ? <EyeOffIcon className="w-5 h-5" aria-hidden="true" /> : <EyeIcon className="w-5 h-5" aria-hidden="true" />}
      </button>
    </div>
  );
};

export default PasswordInput;
