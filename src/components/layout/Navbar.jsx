import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import logo from "../../assets/bookmania_logo.png";

const LANGUAGES = [
  { code: "es", label: "ES" },
  { code: "ca", label: "CA" },
  { code: "en", label: "EN" },
];

const SunIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

const LanguageSelect = ({ id, className }) => {
  const { i18n } = useTranslation();
  return (
    <select id={id} value={i18n.resolvedLanguage} onChange={(e) => i18n.changeLanguage(e.target.value)}
      className={className}>
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>{lang.label}</option>
      ))}
    </select>
  );
};

const ThemeToggle = ({ className }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const nextMode = theme === "dark" ? t("nav.themeLight") : t("nav.themeDark");
  return (
    <button onClick={toggleTheme} aria-label={t("nav.theme", { mode: nextMode })} className={className}>
      {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
};

// Center nav links: the active page gets the same rounded pill treatment as
// the admin/greeting badges elsewhere in this navbar (and the category tags
// on the books grid) instead of growing text and underlining it — one soft,
// rounded language across the whole app rather than a one-off style just
// for this link.
const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${isActive
    ? "bg-pink-900 dark:bg-pink-800 text-white"
    : "text-pink-100 hover:text-white hover:bg-pink-600/40 dark:hover:bg-pink-900/40"}`;

// Mobile menu mirrors the same idea with a block-level pill (rounded-lg,
// matching the buttons elsewhere) since these links stack vertically instead
// of sitting in a row.
const mobileNavLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive
    ? "bg-pink-100 dark:bg-slate-700 text-gray-900 dark:text-white font-semibold"
    : "text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white"}`;

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <>
      {/* Same height as the fixed nav below (72px), so nothing renders under it */}
      <div className="h-[72px]" />

      <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-pink-700 dark:bg-pink-950 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

          <Link to="/" className="shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-700 dark:focus-visible:ring-offset-pink-950">
            {/* The logo PNG has a transparent background with near-black text, so it
                disappears against the near-black dark:bg-pink-950 navbar — give it a
                light backdrop in dark mode only (light mode's pink-700 already has
                enough contrast for the dark text). */}
            <div className="dark:bg-cream-50 dark:rounded-lg dark:px-2.5 dark:py-1 transition-colors">
              <img src={logo} alt="BookMania" className="h-10 w-auto" />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated() && (
              <>
                <NavLink to="/my-loans" className={navLinkClass}>
                  {t("nav.myLoans")}
                </NavLink>
                <NavLink to="/my-reservations" className={navLinkClass}>
                  {t("nav.myReservations")}
                </NavLink>
                <NavLink to="/my-fines" className={navLinkClass}>
                  {t("nav.myFines")}
                </NavLink>
              </>
            )}
            {isAdmin() && (
              <NavLink to="/admin" className={navLinkClass}>
                {t("nav.admin")}
              </NavLink>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <label htmlFor="nav-language" className="sr-only">{t("nav.language")}</label>
            <LanguageSelect id="nav-language"
              className="text-sm bg-pink-800 dark:bg-pink-900 text-white border border-pink-600 dark:border-pink-800 rounded-lg pl-2 pr-1 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer" />
            <ThemeToggle
              className="text-pink-50 hover:text-white p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-700" />
            {isAuthenticated() ? (
              <>
                <Link to="/account" className="text-sm text-pink-50 hover:text-white hover:underline transition-colors">
                  {t("nav.greeting", { name: user?.name })}
                  {isAdmin() && (
                    <span className="ml-2 bg-pink-900 dark:bg-pink-800 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {t("nav.adminBadge")}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout}
                  className="text-sm bg-white dark:bg-slate-800 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-700">
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-pink-50 hover:text-white transition-colors">
                  {t("nav.login")}
                </Link>
                <Link to="/register"
                  className="text-sm bg-pink-900 dark:bg-pink-800 text-white hover:bg-pink-800 dark:hover:bg-pink-700 font-medium px-4 py-2 rounded-lg transition-colors">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            <label htmlFor="nav-language-mobile" className="sr-only">{t("nav.language")}</label>
            <LanguageSelect id="nav-language-mobile"
              className="text-sm bg-pink-800 dark:bg-pink-900 text-white border border-pink-600 dark:border-pink-800 rounded-lg pl-2 pr-1 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer" />
            <ThemeToggle
              className="text-white p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-700" />
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              className="text-white p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-700 rounded">
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-pink-300 dark:bg-slate-800 border-t border-pink-200 dark:border-slate-700 px-4 pb-4 space-y-1">
            {isAuthenticated() && (
              <>
                <NavLink to="/my-loans" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass}>
                  {t("nav.myLoans")}
                </NavLink>
                <NavLink to="/my-reservations" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass}>
                  {t("nav.myReservations")}
                </NavLink>
                <NavLink to="/my-fines" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass}>
                  {t("nav.myFines")}
                </NavLink>
              </>
            )}
            {isAdmin() && (
              <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass}>
                {t("nav.admin")}
              </NavLink>
            )}
            <div className="pt-2 border-t border-pink-200 dark:border-slate-700">
              {isAuthenticated() ? (
                <>
                  <Link to="/account" onClick={() => setMenuOpen(false)}
                    className="block py-1 text-sm text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {user?.name}
                    {isAdmin() && (
                      <span className="ml-2 bg-pink-900 dark:bg-pink-800 text-white text-xs px-2 py-0.5 rounded-full">{t("nav.adminBadge")}</span>
                    )}
                  </Link>
                  <button onClick={handleLogout}
                    className="block py-2 text-sm text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t("nav.login")}
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
