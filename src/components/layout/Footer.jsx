import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 mt-auto border-t border-pink-100 dark:border-slate-800 text-center text-sm text-gray-500 dark:text-slate-400">
      <p>
        &copy; {year} BookMania &middot; {t("footer.madeBy")}{" "}
        <a
          href="https://anna-dev.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-700 dark:text-pink-400 font-medium hover:underline"
        >
          @costanna
        </a>
      </p>
    </footer>
  );
};

export default Footer;
