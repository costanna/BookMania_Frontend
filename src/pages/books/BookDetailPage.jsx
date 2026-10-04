import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import bookService from "../../api/bookService";
import loanService from "../../api/loanService";
import reservationService from "../../api/reservationService";
import { getBookCover, sizedCoverUrl } from "../../utils/bookCover";
import LoadingNotice from "../../components/common/LoadingNotice";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";

const BookDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState(null);
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanDone, setLoanDone] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationDone, setReservationDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBook = async () => {
      try {
        const data = await bookService.getById(id);
        if (cancelled) return;
        setBook(data);
        if (!data.coverUrl || data.coverUrl.includes("ejemplo.com")) {
          const url = await getBookCover(data.isbn);
          if (!cancelled) setCover(url);
        } else {
          setCover(sizedCoverUrl(data.coverUrl, 600, 900));
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || t("books.detail.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBook();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only `id` should re-trigger the fetch
  }, [id]);

  const handleLoan = async () => {
    setLoanLoading(true);
    try {
      await loanService.create(book.id);
      showToast(t("books.detail.loanSuccess"), "success");
      setBook({ ...book, availableCopies: book.availableCopies - 1 });
      setLoanDone(true);
    } catch (err) {
      showToast(err.response?.data?.message || t("books.detail.loanError"), "error");
    } finally {
      setLoanLoading(false);
    }
  };

  const handleReservation = async () => {
    setReservationLoading(true);
    try {
      await reservationService.create(book.id);
      showToast(t("books.detail.reservationSuccess"), "success");
      setReservationDone(true);
    } catch (err) {
      showToast(err.response?.data?.message || t("books.detail.reservationError"), "error");
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingNotice message={t("books.detail.loading")} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-700 dark:text-red-400">{error || t("books.detail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="text-sm text-pink-700 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 mb-6 flex items-center gap-1">
        ← {t("common.backToCatalog")}
      </button>

      <div className="flex flex-col md:flex-row gap-10">

        <div className="w-full md:w-56 flex-shrink-0">
          <div className="bg-pink-50 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-[2/3] border border-pink-100 dark:border-slate-700">
            {cover ? (
              <img src={cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pink-700 dark:text-pink-400 text-sm text-center p-4">
                {t("books.noCover")}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-pink-700 dark:text-pink-400 mb-2">{book.title}</h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 mb-4">{book.author}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {book.categories?.map((cat) => (
              <span key={cat}
                className="bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900 text-sm px-3 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm bg-pink-50 dark:bg-slate-800 rounded-2xl p-4 border border-pink-100 dark:border-slate-700">
            {book.isbn && (
              <div>
                <p className="text-pink-700 dark:text-pink-400 font-medium">{t("books.detail.isbn")}</p>
                <p className="text-gray-700 dark:text-slate-300">{book.isbn}</p>
              </div>
            )}
            {book.pages && (
              <div>
                <p className="text-pink-700 dark:text-pink-400 font-medium">{t("books.detail.pages")}</p>
                <p className="text-gray-700 dark:text-slate-300">{book.pages}</p>
              </div>
            )}
            {book.publishYear && (
              <div>
                <p className="text-pink-700 dark:text-pink-400 font-medium">{t("books.detail.publishYear")}</p>
                <p className="text-gray-700 dark:text-slate-300">{book.publishYear}</p>
              </div>
            )}
            <div>
              <p className="text-pink-700 dark:text-pink-400 font-medium">{t("books.detail.totalCopies")}</p>
              <p className="text-gray-700 dark:text-slate-300">{book.totalCopies}</p>
            </div>
            <div>
              <p className="text-pink-700 dark:text-pink-400 font-medium">{t("books.detail.availability")}</p>
              {book.availableCopies > 0 ? (
                <p className="text-green-700 dark:text-green-400 font-medium">
                  {t("books.detail.copiesAvailable", { count: book.availableCopies })}
                </p>
              ) : (
                <p className="text-red-700 dark:text-red-400 font-medium">{t("books.unavailable")}</p>
              )}
            </div>
          </div>

          {!isAuthenticated() ? (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              <button onClick={() => navigate("/login")} className="text-pink-700 dark:text-pink-400 hover:underline">
                {t("books.detail.loginLink")}
              </button>{" "}
              {t("books.detail.loginPrompt")}
            </p>
          ) : book.availableCopies > 0 ? (
            <button onClick={handleLoan} disabled={loanLoading || loanDone}
              className="bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500 dark:disabled:bg-pink-900 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors">
              {loanLoading ? t("books.detail.requestingLoan") : loanDone ? t("books.detail.loanRequested") : t("books.detail.requestLoan")}
            </button>
          ) : (
            <button onClick={handleReservation} disabled={reservationLoading || reservationDone}
              className="bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500 dark:disabled:bg-pink-900 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors">
              {reservationLoading ? t("books.detail.requestingReservation") : reservationDone ? t("books.detail.reservationDone") : t("books.detail.requestReservation")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
