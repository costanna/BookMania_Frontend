import { DEMO_DB_KEY, DEMO_PASSWORD, DEMO_USERS, isDemoChosen } from "../demo";

// Bump when the shape of the data changes: an older copy saved in someone's
// browser is then replaced by the new initial data instead of breaking.
const DEMO_DB_VERSION = 1;

const pad = (n) => String(n).padStart(2, "0");

// Dates as the API sends them: LocalDate "YYYY-MM-DD", LocalDateTime
// "YYYY-MM-DDTHH:mm:ss" (local time, no zone).
export const localDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const localDateTime = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${localDate(offsetDays)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const MZ = "https://is1-ssl.mzstatic.com/image/thumb";

const seedBooks = [
  // id, title, author, isbn, pages, year, totalCopies, categoryIds, coverUrl
  [1, "Aleación de ley", "Brandon Sanderson", "9788490192214", 384, 2011, 3, [3],
    `${MZ}/Publication211/v4/f9/5e/e2/f95ee287-9281-4c07-42d6-5f74bfc93999/9788490192214.jpg/600x600bb.jpg`],
  [2, "Amanecer rojo", "Pierce Brown", "9788490069677", 512, 2014, 5, [4],
    `${MZ}/Publication126/v4/be/52/10/be5210a0-5cf4-889f-27c1-a2082eec797b/9788490069677.jpg/600x600bb.jpg`],
  [3, "El nombre del viento", "Patrick Rothfuss", "9788401337208", 880, 2007, 1, [1]],
  [4, "El temor de un hombre sabio", "Patrick Rothfuss", "9788401339639", 1200, 2011, 2, [1]],
  [5, "El imperio final", "Brandon Sanderson", "9788466658898", 688, 2006, 3, [1]],
  [6, "Dune", "Frank Herbert", "9788497596824", 784, 1965, 2, [4, 6]],
  [7, "1984", "George Orwell", "9788499890944", 352, 1949, 3, [4, 6]],
  [8, "Fahrenheit 451", "Ray Bradbury", "9788490321478", 176, 1953, 2, [4, 6]],
  [9, "El problema de los tres cuerpos", "Liu Cixin", "9788466659734", 416, 2008, 2, [4]],
  [10, "El Hobbit", "J. R. R. Tolkien", "9788445000663", 320, 1937, 3, [3, 6]],
  [11, "Harry Potter y la piedra filosofal", "J. K. Rowling", "9788478884452", 256, 1997, 4, [5]],
  [12, "Los juegos del hambre", "Suzanne Collins", "9788427202122", 400, 2008, 3, [5, 4]],
  [13, "El principito", "Antoine de Saint-Exupéry", "9788498381498", 96, 1943, 2, [6]],
  [14, "Cien años de soledad", "Gabriel García Márquez", "9788497592208", 496, 1967, 3, [6, 7]],
  [15, "Rayuela", "Julio Cortázar", "9788420437484", 736, 1963, 1, [7]],
  [16, "La sombra del viento", "Carlos Ruiz Zafón", "9788408163435", 576, 2001, 2, [7]],
  [17, "Sapiens. De animales a dioses", "Yuval Noah Harari", "9788499926223", 496, 2011, 2, [8]],
];

const createInitialDb = () => {
  const categories = [
    { id: 1, name: "Fantasía épica", description: "Grandes sagas de fantasía con mundos extensos y tramas corales." },
    { id: 2, name: "Fantasía oscura", description: "Fantasía grimdark: moralmente ambigua, cruda y despiadada." },
    { id: 3, name: "Fantasía", description: "Fantasía general, mundos secundarios y magia." },
    { id: 4, name: "Ciencia ficción", description: "Futuros posibles, espacio y tecnología." },
    { id: 5, name: "Fantasía juvenil", description: "Aventuras para lectores jóvenes (y no tan jóvenes)." },
    { id: 6, name: "Clásicos", description: "Libros que han resistido el paso del tiempo." },
    { id: 7, name: "Novela", description: "Narrativa contemporánea y literaria." },
    { id: 8, name: "Ensayo", description: "No ficción: historia, ciencia y pensamiento." },
  ];

  const books = seedBooks.map(([id, title, author, isbn, pages, publishYear, totalCopies, categoryIds, coverUrl]) => ({
    id, title, author, isbn, pages, publishYear, coverUrl: coverUrl ?? null,
    totalCopies, availableCopies: totalCopies, categoryIds, createdAt: localDateTime(-90),
  }));

  const users = [...DEMO_USERS].sort((a, b) => a.id - b.id).map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, password: DEMO_PASSWORD,
    active: true, penaltyUntil: null, memberSince: localDate(-120), createdAt: localDateTime(-120),
  }));

  const loans = [
    // Lector Demo: two books at home (one due soon) and one already returned
    { id: 1, userId: 2, bookId: 1, issueDate: localDate(-5), dueDate: localDate(16), returnDate: null, extensionsUsed: 0, status: "ISSUED", createdAt: localDateTime(-5) },
    { id: 2, userId: 2, bookId: 6, issueDate: localDate(-18), dueDate: localDate(3), returnDate: null, extensionsUsed: 0, status: "ISSUED", createdAt: localDateTime(-18) },
    { id: 3, userId: 2, bookId: 13, issueDate: localDate(-60), dueDate: localDate(-39), returnDate: localDate(-45), extensionsUsed: 0, status: "RETURNED", createdAt: localDateTime(-60) },
    // Lectora con multa: holds the only copy of "El nombre del viento" and
    // returned "1984" a week late, which is where her penalty comes from
    { id: 4, userId: 3, bookId: 3, issueDate: localDate(-10), dueDate: localDate(11), returnDate: null, extensionsUsed: 0, status: "ISSUED", createdAt: localDateTime(-10) },
    { id: 5, userId: 3, bookId: 7, issueDate: localDate(-40), dueDate: localDate(-19), returnDate: localDate(-12), extensionsUsed: 0, status: "RETURNED", createdAt: localDateTime(-40) },
  ];

  for (const loan of loans) {
    if (loan.status !== "RETURNED") books.find((b) => b.id === loan.bookId).availableCopies -= 1;
  }

  // 7 days late: 30 base days + 1 per day late = 37 days, counted from the return
  const penaltyUntil = localDate(-12 + 37);
  users.find((u) => u.id === 3).penaltyUntil = penaltyUntil;
  const fines = [
    { id: 1, loanId: 5, userId: 3, daysOverdue: 7, penaltyDays: 37, penaltyUntil, createdAt: localDateTime(-12) },
  ];

  const reservations = [
    // Lector Demo is waiting for the copy Lectora con multa has at home
    { id: 1, userId: 2, bookId: 3, queuePosition: 1, reservationDate: localDate(-2), expiryDate: null, status: "PENDING", createdAt: localDateTime(-2) },
  ];

  return { users, categories, books, loans, reservations, fines };
};

const loadDb = () => {
  if (isDemoChosen()) {
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_DB_KEY) ?? "null");
      if (saved?.version === DEMO_DB_VERSION && saved.db) return saved.db;
    } catch {
      // Corrupt or unreadable copy: start from the initial data
    }
  }
  return createInitialDb();
};

// Mutated in place by the mock server; the demo saves it after every change.
export const db = loadDb();

export const resetMockDb = () => {
  Object.assign(db, createInitialDb());
};

export const saveDemoDb = () => {
  if (!isDemoChosen()) return;
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify({ version: DEMO_DB_VERSION, db }));
  } catch {
    // Storage full or blocked: the demo keeps working, just without memory
  }
};
