import { db, localDate, localDateTime } from "./db";

// In-browser stand-in for the Spring Boot API, used by the demo. Same routes,
// same response shapes, same business rules and the same error messages as
// the backend services (LoanService, ReservationService, FineService...), so
// the UI can't tell the difference.

const MAX_ACTIVE_LOANS = 7;
const LOAN_DAYS = 21;
const EXTENSION_DAYS = 10;
const MAX_EXTENSIONS = 3;
const MAX_QUEUE_SIZE = 3;
const PICKUP_DAYS = 3;
const BASE_PENALTY_DAYS = 30;
const EXTRA_DAYS_PER_OVERDUE_DAY = 1;

export class MockError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (message) => new MockError(400, message);
const notFound = (message) => new MockError(404, message);
const forbidden = (message) => new MockError(403, message);
const unauthorized = (message) => new MockError(401, message);

// ---- dates ("YYYY-MM-DD" strings, compared and shifted as UTC days) ----

const today = () => localDate(0);
const toUtc = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const addDays = (date, days) => new Date(toUtc(date) + days * 86_400_000).toISOString().slice(0, 10);
const daysBetween = (from, to) => Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
const isAfter = (a, b) => toUtc(a) > toUtc(b);

// ---- lookups ----

const nextId = (items) => Math.max(0, ...items.map((i) => i.id)) + 1;
const findOr404 = (items, id, message) => {
  const item = items.find((i) => i.id === Number(id));
  if (!item) throw notFound(message);
  return item;
};
const userById = (id) => db.users.find((u) => u.id === id);
const bookById = (id) => db.books.find((b) => b.id === id);

const currentUser = (token) => {
  const id = Number(/^demo-token:(\d+)$/.exec(token ?? "")?.[1]);
  const user = userById(id);
  if (!user || !user.active) throw unauthorized("Sesión no válida");
  return user;
};

const requireAdmin = (user) => {
  if (user.role !== "ADMIN") throw forbidden("No tienes permiso para realizar esta acción");
};

const hasActivePenalty = (user) => user.penaltyUntil != null && isAfter(user.penaltyUntil, today());

const required = (value, message) => {
  if (value == null || String(value).trim() === "") throw badRequest(message);
};

// ---- response shapes (the backend DTOs) ----

const toBook = (b) => ({
  id: b.id, title: b.title, author: b.author, isbn: b.isbn, pages: b.pages ?? null,
  publishYear: b.publishYear ?? null, coverUrl: b.coverUrl ?? null,
  totalCopies: b.totalCopies, availableCopies: b.availableCopies,
  categories: b.categoryIds.map((id) => db.categories.find((c) => c.id === id)?.name).filter(Boolean),
});

const toCategory = (c) => ({ id: c.id, name: c.name, description: c.description ?? null });

const toLoan = (l) => ({
  id: l.id, userName: userById(l.userId)?.name, bookTitle: bookById(l.bookId)?.title,
  issueDate: l.issueDate, dueDate: l.dueDate, returnDate: l.returnDate,
  extensionsUsed: l.extensionsUsed, status: l.status,
});

const toReservation = (r) => ({
  id: r.id, userName: userById(r.userId)?.name, bookTitle: bookById(r.bookId)?.title,
  queuePosition: r.queuePosition, reservationDate: r.reservationDate, expiryDate: r.expiryDate,
  status: r.status, createdAt: r.createdAt,
});

const toFine = (f) => {
  const loan = db.loans.find((l) => l.id === f.loanId);
  return {
    id: f.id, loanId: f.loanId, bookTitle: bookById(loan?.bookId)?.title, userName: userById(f.userId)?.name,
    daysOverdue: f.daysOverdue, penaltyDays: f.penaltyDays, penaltyUntil: f.penaltyUntil,
    penaltyDaysRemaining: isAfter(f.penaltyUntil, today()) ? daysBetween(today(), f.penaltyUntil) : 0,
    createdAt: f.createdAt,
  };
};

const authResponse = (user) => ({
  token: `demo-token:${user.id}`, email: user.email, role: user.role, name: user.name,
});

// ---- shared rules ----

// FineService.generateFine
const generateFine = (loan) => {
  if (db.fines.some((f) => f.loanId === loan.id)) return;
  const daysOverdue = daysBetween(loan.dueDate, today());
  if (daysOverdue <= 0) return;

  const penaltyDays = BASE_PENALTY_DAYS + daysOverdue * EXTRA_DAYS_PER_OVERDUE_DAY;
  const user = userById(loan.userId);
  const base = hasActivePenalty(user) ? user.penaltyUntil : today();
  const penaltyUntil = addDays(base, penaltyDays);
  user.penaltyUntil = penaltyUntil;

  db.fines.push({
    id: nextId(db.fines), loanId: loan.id, userId: user.id, daysOverdue, penaltyDays, penaltyUntil,
    createdAt: localDateTime(0),
  });
};

// LoanScheduler.markOverdueLoans - the backend runs it nightly; the demo
// catches up on every request.
const markOverdueLoans = () => {
  for (const loan of db.loans) {
    if (loan.status === "ISSUED" && isAfter(today(), loan.dueDate)) {
      loan.status = "OVERDUE";
      generateFine(loan);
    }
  }
};

const pendingQueue = (bookId) =>
  db.reservations
    .filter((r) => r.bookId === bookId && r.status === "PENDING")
    .sort((a, b) => a.queuePosition - b.queuePosition);

// ReservationService.notifyNextInQueue
const notifyNextInQueue = (bookId) => {
  const [first] = pendingQueue(bookId);
  if (first) first.expiryDate = addDays(today(), PICKUP_DAYS);
};

// ReservationService.reorderQueue
const reorderQueue = (bookId, cancelledPosition) => {
  for (const r of pendingQueue(bookId)) {
    if (r.queuePosition > cancelledPosition) r.queuePosition -= 1;
  }
};

const validCategoryIds = (ids) => {
  const valid = [...new Set(ids ?? [])].map(Number).filter((id) => db.categories.some((c) => c.id === id));
  if (valid.length === 0) throw notFound("No se encontraron categorías válidas");
  return valid;
};

const validateBook = (body) => {
  required(body?.title, "El título es obligatorio");
  required(body?.author, "El autor es obligatorio");
  required(body?.isbn, "El ISBN es obligatorio");
  if (!(Number(body?.totalCopies) >= 1)) throw badRequest("Debe haber al menos 1 copia");
  if (!Array.isArray(body?.categoryIds) || body.categoryIds.length === 0) {
    throw badRequest("Elige al menos una categoría");
  }
};

const optionalNumber = (value) => (value === "" || value == null ? null : Number(value));

// ---- routes ----

const routes = [
  // auth
  ["POST", /^\/api\/auth\/login$/, ({ body }) => {
    required(body?.email, "El email es obligatorio");
    required(body?.password, "La contraseña es obligatoria");
    const user = db.users.find((u) => u.email === body.email);
    if (!user || user.password !== body.password) throw unauthorized("Email o contraseña incorrectos");
    if (!user.active) throw unauthorized("Esta cuenta está desactivada");
    return authResponse(user);
  }],
  ["POST", /^\/api\/auth\/register$/, ({ body }) => {
    required(body?.name, "El nombre es obligatorio");
    required(body?.email, "El email es obligatorio");
    if (!/^[^@\s]+@[^@\s]+$/.test(body.email)) throw badRequest("Email no válido");
    required(body?.password, "La contraseña es obligatoria");
    if (db.users.some((u) => u.email === body.email)) throw badRequest("El email ya está registrado");
    const user = {
      id: nextId(db.users), name: body.name, email: body.email, password: body.password, role: "USER",
      active: true, penaltyUntil: null, memberSince: today(), createdAt: localDateTime(0),
    };
    db.users.push(user);
    return authResponse(user);
  }],
  ["PUT", /^\/api\/users\/me\/password$/, ({ token, body }) => {
    const user = currentUser(token);
    required(body?.currentPassword, "La contraseña actual es obligatoria");
    required(body?.newPassword, "La nueva contraseña es obligatoria");
    if (body.newPassword.length < 6) throw badRequest("La nueva contraseña debe tener al menos 6 caracteres");
    if (body.currentPassword !== user.password) throw badRequest("La contraseña actual no es correcta");
    if (body.newPassword === user.password) throw badRequest("La nueva contraseña debe ser distinta de la actual");
    user.password = body.newPassword;
    return null;
  }],

  // books
  ["GET", /^\/api\/books$/, ({ params }) => {
    const title = params.title?.trim().toLowerCase();
    const categoryId = params.categoryId ? Number(params.categoryId) : null;
    const page = Number(params.page ?? 0);
    const size = Number(params.size ?? 25);
    const matches = db.books
      .filter((b) => !title || b.title.toLowerCase().includes(title) || b.author.toLowerCase().includes(title))
      .filter((b) => categoryId == null || b.categoryIds.includes(categoryId))
      .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
    const content = matches.slice(page * size, page * size + size).map(toBook);
    const totalPages = Math.ceil(matches.length / size);
    return {
      content, totalElements: matches.length, totalPages, number: page, size,
      numberOfElements: content.length, first: page === 0, last: page >= totalPages - 1, empty: content.length === 0,
    };
  }],
  ["GET", /^\/api\/books\/(\d+)$/, ({ match }) => toBook(findOr404(db.books, match[1], "Libro no encontrado"))],
  ["POST", /^\/api\/books$/, ({ token, body }) => {
    requireAdmin(currentUser(token));
    validateBook(body);
    if (db.books.some((b) => b.isbn === body.isbn)) throw badRequest("Ya existe un libro con ese ISBN");
    const totalCopies = Number(body.totalCopies);
    const book = {
      id: nextId(db.books), title: body.title, author: body.author, isbn: body.isbn,
      pages: optionalNumber(body.pages), publishYear: optionalNumber(body.publishYear), coverUrl: body.coverUrl || null,
      totalCopies, availableCopies: totalCopies, categoryIds: validCategoryIds(body.categoryIds), createdAt: localDateTime(0),
    };
    db.books.push(book);
    return { status: 201, body: toBook(book) };
  }],
  ["PUT", /^\/api\/books\/(\d+)$/, ({ token, body, match }) => {
    requireAdmin(currentUser(token));
    validateBook(body);
    const book = findOr404(db.books, match[1], "Libro no encontrado");
    const categoryIds = validCategoryIds(body.categoryIds);
    // Restocking adds available copies; destocking removes them (floored at 0)
    const delta = Number(body.totalCopies) - book.totalCopies;
    Object.assign(book, {
      availableCopies: Math.max(0, book.availableCopies + delta),
      title: body.title, author: body.author, isbn: body.isbn,
      pages: optionalNumber(body.pages), publishYear: optionalNumber(body.publishYear), coverUrl: body.coverUrl || null,
      totalCopies: Number(body.totalCopies), categoryIds,
    });
    return toBook(book);
  }],
  ["DELETE", /^\/api\/books\/(\d+)$/, ({ token, match }) => {
    requireAdmin(currentUser(token));
    const book = findOr404(db.books, match[1], "Libro no encontrado");
    if (db.loans.some((l) => l.bookId === book.id) || db.reservations.some((r) => r.bookId === book.id)) {
      throw badRequest("No se puede eliminar el libro: tiene préstamos, reservas o multas asociadas");
    }
    db.books = db.books.filter((b) => b.id !== book.id);
    return { status: 204, body: null };
  }],

  // categories
  ["GET", /^\/api\/categories$/, () => [...db.categories].sort((a, b) => a.id - b.id).map(toCategory)],
  ["GET", /^\/api\/categories\/(\d+)$/, ({ match }) => toCategory(findOr404(db.categories, match[1], "Categoría no encontrada"))],
  ["POST", /^\/api\/categories$/, ({ token, body }) => {
    requireAdmin(currentUser(token));
    required(body?.name, "El nombre es obligatorio");
    if (db.categories.some((c) => c.name === body.name)) throw badRequest("Ya existe una categoría con ese nombre");
    const category = { id: nextId(db.categories), name: body.name, description: body.description ?? null };
    db.categories.push(category);
    return { status: 201, body: toCategory(category) };
  }],
  ["PUT", /^\/api\/categories\/(\d+)$/, ({ token, body, match }) => {
    requireAdmin(currentUser(token));
    required(body?.name, "El nombre es obligatorio");
    const category = findOr404(db.categories, match[1], "Categoría no encontrada");
    Object.assign(category, { name: body.name, description: body.description ?? null });
    return toCategory(category);
  }],
  ["DELETE", /^\/api\/categories\/(\d+)$/, ({ token, match }) => {
    requireAdmin(currentUser(token));
    const category = findOr404(db.categories, match[1], "Categoría no encontrada");
    for (const book of db.books) book.categoryIds = book.categoryIds.filter((id) => id !== category.id);
    db.categories = db.categories.filter((c) => c.id !== category.id);
    return { status: 204, body: null };
  }],

  // loans
  ["POST", /^\/api\/loans$/, ({ token, body }) => {
    const user = currentUser(token);
    // A penalty that has fully run out is cleared on the next loan attempt
    if (user.penaltyUntil != null && !isAfter(addDays(user.penaltyUntil, 1), today())) user.penaltyUntil = null;
    if (hasActivePenalty(user)) throw badRequest(`Tienes una penalización activa hasta ${user.penaltyUntil}`);

    const active = db.loans.filter((l) => l.userId === user.id && l.status === "ISSUED").length;
    if (active >= MAX_ACTIVE_LOANS) {
      throw badRequest(`Has alcanzado el límite de ${MAX_ACTIVE_LOANS} préstamos activos simultáneos`);
    }
    const book = findOr404(db.books, body?.bookId, "Libro no encontrado");
    if (book.availableCopies <= 0) throw badRequest("No hay copias disponibles. Puedes hacer una reserva.");
    if (db.loans.some((l) => l.userId === user.id && l.bookId === book.id && l.status === "ISSUED")) {
      throw badRequest("Ya tienes este libro en préstamo");
    }

    // ReservationService.fulfillReservation
    const reservation = db.reservations.find(
      (r) => r.userId === user.id && r.bookId === book.id && r.status === "PENDING",
    );
    if (reservation) reservation.status = "FULFILLED";

    const loan = {
      id: nextId(db.loans), userId: user.id, bookId: book.id, issueDate: today(), dueDate: addDays(today(), LOAN_DAYS),
      returnDate: null, extensionsUsed: 0, status: "ISSUED", createdAt: localDateTime(0),
    };
    db.loans.push(loan);
    book.availableCopies -= 1;
    return toLoan(loan);
  }],
  ["GET", /^\/api\/loans\/my$/, ({ token }) => {
    const user = currentUser(token);
    return db.loans.filter((l) => l.userId === user.id).map(toLoan);
  }],
  ["GET", /^\/api\/loans$/, ({ token }) => {
    requireAdmin(currentUser(token));
    return db.loans.map(toLoan);
  }],
  ["PUT", /^\/api\/loans\/(\d+)\/extend$/, ({ token, match }) => {
    const user = currentUser(token);
    const isAdmin = user.role === "ADMIN";
    const loan = findOr404(db.loans, match[1], "Préstamo no encontrado");
    if (!isAdmin && loan.userId !== user.id) throw forbidden("No tienes permiso para prorrogar este préstamo");
    if (loan.status === "RETURNED") throw badRequest("No se puede prorrogar un préstamo ya devuelto");
    if (loan.status === "OVERDUE") throw badRequest("El préstamo está vencido. No puedes prorrogar.");
    if (loan.extensionsUsed >= MAX_EXTENSIONS) {
      throw badRequest(`Has alcanzado el máximo de prórrogas permitidas (${MAX_EXTENSIONS})`);
    }
    if (!isAdmin && hasActivePenalty(user)) throw badRequest(`Tienes una penalización activa hasta ${user.penaltyUntil}`);
    loan.dueDate = addDays(loan.dueDate, EXTENSION_DAYS);
    loan.extensionsUsed += 1;
    return toLoan(loan);
  }],
  ["PUT", /^\/api\/loans\/(\d+)\/return$/, ({ token, match }) => {
    const user = currentUser(token);
    const loan = findOr404(db.loans, match[1], "Préstamo no encontrado");
    if (user.role !== "ADMIN" && loan.userId !== user.id) throw forbidden("No tienes permiso para devolver este préstamo");
    if (loan.status === "RETURNED") throw badRequest("Este préstamo ya fue devuelto");
    if (isAfter(today(), loan.dueDate)) {
      loan.status = "OVERDUE";
      generateFine(loan);
    }
    loan.status = "RETURNED";
    loan.returnDate = today();
    const book = bookById(loan.bookId);
    book.availableCopies += 1;
    notifyNextInQueue(book.id);
    return toLoan(loan);
  }],

  // reservations
  ["POST", /^\/api\/reservations$/, ({ token, body }) => {
    const user = currentUser(token);
    if (hasActivePenalty(user)) {
      throw badRequest(`Tienes una penalización activa hasta ${user.penaltyUntil}. No puedes hacer reservas.`);
    }
    const book = findOr404(db.books, body?.bookId, "Libro no encontrado");
    if (book.availableCopies > 0) throw badRequest("El libro está disponible. Solicita un préstamo directamente.");
    if (db.reservations.some((r) => r.userId === user.id && r.bookId === book.id && r.status === "PENDING")) {
      throw badRequest("Ya tienes una reserva activa para este libro.");
    }
    const queueSize = pendingQueue(book.id).length;
    if (queueSize >= MAX_QUEUE_SIZE) {
      throw badRequest(`La cola de espera está llena (máximo ${MAX_QUEUE_SIZE} personas).`);
    }
    const reservation = {
      id: nextId(db.reservations), userId: user.id, bookId: book.id, queuePosition: queueSize + 1,
      reservationDate: today(), expiryDate: null, status: "PENDING", createdAt: localDateTime(0),
    };
    db.reservations.push(reservation);
    return toReservation(reservation);
  }],
  ["DELETE", /^\/api\/reservations\/(\d+)$/, ({ token, match }) => {
    const user = currentUser(token);
    const reservation = findOr404(db.reservations, match[1], "Reserva no encontrada");
    if (reservation.userId !== user.id) throw forbidden("No tienes permiso para cancelar esta reserva");
    if (reservation.status !== "PENDING") throw badRequest("Solo se pueden cancelar reservas pendientes");
    reservation.status = "CANCELLED";
    reorderQueue(reservation.bookId, reservation.queuePosition);
    return toReservation(reservation);
  }],
  ["GET", /^\/api\/reservations\/my$/, ({ token }) => {
    const user = currentUser(token);
    return db.reservations.filter((r) => r.userId === user.id).map(toReservation);
  }],
  ["GET", /^\/api\/reservations$/, ({ token }) => {
    requireAdmin(currentUser(token));
    return db.reservations.map(toReservation);
  }],

  // fines
  ["GET", /^\/api\/fines\/my$/, ({ token }) => {
    const user = currentUser(token);
    return db.fines.filter((f) => f.userId === user.id).map(toFine);
  }],
  ["GET", /^\/api\/fines$/, ({ token }) => {
    requireAdmin(currentUser(token));
    return db.fines.map(toFine);
  }],
  ["DELETE", /^\/api\/fines\/(\d+)$/, ({ token, match }) => {
    requireAdmin(currentUser(token));
    const fine = findOr404(db.fines, match[1], "Multa no encontrada");
    const user = userById(fine.userId);
    if (hasActivePenalty(user)) user.penaltyUntil = null;
    db.fines = db.fines.filter((f) => f.id !== fine.id);
    return { status: 204, body: null };
  }],
];

/**
 * Answers one API request. Returns { status, body }; throws MockError with
 * the HTTP status and message the real backend would send.
 */
export const handleRequest = ({ method, path, params = {}, body = null, token = null }) => {
  markOverdueLoans();
  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue;
    const match = pattern.exec(path);
    if (!match) continue;
    const result = handler({ match, params, body, token });
    if (result && typeof result === "object" && "status" in result && "body" in result && Object.keys(result).length === 2) {
      return result;
    }
    return { status: 200, body: result };
  }
  throw notFound(`No existe ${method} ${path} en la demo`);
};
