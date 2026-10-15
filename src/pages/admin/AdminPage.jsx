import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import adminService from "../../api/adminService";
import bookService from "../../api/bookService";
import ConfirmModal from "../../components/common/ConfirmModal";
import LoadingNotice from "../../components/common/LoadingNotice";
import useToast from "../../hooks/useToast";
import AdminLoansTab from "./tabs/AdminLoansTab";
import AdminFinesTab from "./tabs/AdminFinesTab";
import AdminReservationsTab from "./tabs/AdminReservationsTab";
import AdminBooksTab from "./tabs/AdminBooksTab";
import AdminCategoriesTab from "./tabs/AdminCategoriesTab";

const TAB_KEYS = ["loans", "fines", "reservations", "books", "categories"];

// This page only orchestrates: it owns the fetched data + which tab is
// active + the one shared confirm modal. Each tab's own search/pagination
// state, form state and CRUD handlers live in its own file under ./tabs —
// see that directory for the loans/fines/reservations/books/categories logic.
const AdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("loans");
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, message: "", onConfirm: null });
  const { showToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAll must run only once on mount
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [loansData, finesData, reservationsData, booksData, categoriesData] = await Promise.all([
        adminService.getAllLoans(),
        adminService.getAllFines(),
        adminService.getAllReservations(),
        bookService.getAll({ size: 1000 }),
        bookService.getCategories(),
      ]);
      setLoans(loansData);
      setFines(finesData);
      setReservations(reservationsData);
      setBooks(booksData.content);
      setCategories(categoriesData);
    } catch {
      showToast(t("admin.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const confirm = (message, onConfirm) => setModal({ open: true, message, onConfirm });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingNotice message={t("admin.loading")} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 mb-6">{t("admin.title")}</h1>

      <div role="tablist" aria-label={t("admin.title")} className="flex gap-2 mb-8 border-b border-pink-100 dark:border-slate-700 overflow-x-auto">
        {TAB_KEYS.map((tab) => (
          <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 ${activeTab === tab
              ? "border-pink-700 dark:border-pink-400 text-pink-700 dark:text-pink-400"
              : "border-transparent text-gray-600 dark:text-slate-400 hover:text-pink-700 dark:hover:text-pink-400"}`}>
            {t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === "loans" && <AdminLoansTab loans={loans} setLoans={setLoans} confirm={confirm} />}
      {activeTab === "fines" && <AdminFinesTab fines={fines} setFines={setFines} confirm={confirm} />}
      {activeTab === "reservations" && <AdminReservationsTab reservations={reservations} />}
      {activeTab === "books" && <AdminBooksTab books={books} setBooks={setBooks} categories={categories} confirm={confirm} />}
      {activeTab === "categories" && <AdminCategoriesTab categories={categories} setCategories={setCategories} confirm={confirm} />}

      {modal.open && (
        <ConfirmModal message={modal.message}
          onConfirm={() => { setModal({ open: false }); modal.onConfirm(); }}
          onCancel={() => setModal({ open: false })} />
      )}
    </div>
  );
};

export default AdminPage;
