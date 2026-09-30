import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import bookService from "../../api/bookService";
import { getBookCover } from "../../utils/bookCover";
import useToast from "../../hooks/useToast";
import Pagination from "../../components/common/Pagination";
import LoadingNotice from "../../components/common/LoadingNotice";

const BookCover = ({ isbn, coverUrl }) => {
  const { t } = useTranslation();
  const [cover, setCover] = useState(coverUrl || null);

  useEffect(() => {
    let cancelled = false;
    if (!coverUrl || coverUrl.includes("ejemplo.com")) {
      getBookCover(isbn).then((url) => {
        if (!cancelled && url) setCover(url);
      });
    }
    return () => { cancelled = true; };
  }, [isbn, coverUrl]);

  return (
    <div className="bg-pink-50 dark:bg-slate-800 rounded-xl overflow-hidden aspect-[2/3] mb-3 border border-pink-100 dark:border-slate-700">
      {cover ? (
        <img src={cover} alt="" loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-pink-700 dark:text-pink-400 text-sm text-center p-4">
          {t("books.noCover")}
        </div>
      )}
    </div>
  );
};

const BooksPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  // 21 = 3x7 or 7x3, so every breakpoint below can use a column count that
  // divides it evenly (1, 3, 7) - the last row is always full, never ragged.
  const PAGE_SIZE = 21;

  // Only the very first load should show the full-page skeleton; a search
  // or page change while books are already on screen shouldn't blank the
  // list out from under the user.
  const hasLoadedOnce = useRef(false);

  // Categories can resolve well after the books list (independent request,
  // no shared timing), and that resolution re-runs the effect below with
  // whatever page/search/category were current *then*. If the user has
  // already moved on by the time an older request's response lands, applying
  // it would silently drag the page back - e.g. Next looked instant, then
  // snapped back to the previous page once the stale response arrived. Only
  // the most recently *started* request is allowed to write to state.
  const latestRequestId = useRef(0);

  const fetchBooks = useCallback(async (page = 0, titleAuthor = "", catId = "") => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (titleAuthor) params.title = titleAuthor;
      if (catId) params.categoryId = catId;

      const data = await bookService.getAll(params);
      if (requestId !== latestRequestId.current) return; // a newer request is already in flight

      setBooks(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      if (requestId !== latestRequestId.current) return;
      showToast(t("books.loadError"), "error");
      setBooks([]);
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showToast/t identity is stable enough for a mount-driven fetch
  }, []);

  useEffect(() => {
    bookService.getCategories().then(setCategories).catch(() => {
      showToast(t("books.categoriesLoadError"), "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  useEffect(() => {
    const cat = categories.find((c) => c.name === selectedCategory);
    fetchBooks(currentPage, search, cat?.id || "");
  }, [currentPage, search, selectedCategory, fetchBooks, categories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(0);
  };

  if (loading && !hasLoadedOnce.current) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 mb-3">{t("books.title")}</h1>
        <LoadingNotice message={t("books.loadingCatalog")} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-7 gap-6" aria-hidden="true">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-pink-100 dark:bg-slate-800 rounded-xl aspect-[2/3] mb-3" />
              <div className="bg-pink-100 dark:bg-slate-800 rounded h-3 mb-1.5" />
              <div className="bg-pink-100 dark:bg-slate-800 rounded h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-pink-700 dark:text-pink-400 mb-6">{t("books.title")}</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <label htmlFor="book-search" className="sr-only">{t("books.searchLabel")}</label>
        <input
          id="book-search"
          type="text"
          placeholder={t("books.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[200px] border border-pink-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600"
        />
        <label htmlFor="book-category" className="sr-only">{t("books.categoryLabel")}</label>
        <select
          id="book-category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="border border-pink-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-600"
        >
          <option value="">{t("books.allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 flex items-center gap-2" role="status" aria-live="polite">
        <span>
          {t("books.resultsCount", { count: totalElements })}
          {totalPages > 1 && ` · ${t("books.pageOf", { current: currentPage + 1, total: totalPages })}`}
        </span>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-pink-700 dark:text-pink-400">
            <svg viewBox="0 0 24 24" fill="none" className="animate-spin w-3.5 h-3.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {t("books.updating")}
          </span>
        )}
      </p>

      {books.length === 0 ? (
        <p className="text-gray-600 dark:text-slate-400 text-center py-12">{t("books.noResults")}</p>
      ) : (
        <div aria-busy={loading} className={`grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-7 gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {books.map((book) => (
            <Link key={book.id} to={`/books/${book.id}`} className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2">
              <BookCover isbn={book.isbn} coverUrl={book.coverUrl} />
              <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-2 group-hover:text-pink-800 dark:group-hover:text-pink-400 transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{book.author}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {book.categories?.map((cat) => (
                  <span key={cat} className="text-xs bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded-full border border-pink-100 dark:border-pink-900">
                    {cat}
                  </span>
                ))}
              </div>
              <div className="mt-1">
                {book.availableCopies > 0 ? (
                  <span className="text-xs text-green-700 dark:text-green-400 font-medium">{t("books.available")}</span>
                ) : (
                  <span className="text-xs text-red-700 dark:text-red-400 font-medium">{t("books.unavailable")}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} disabled={loading} />
    </div>
  );
};

export default BooksPage;
