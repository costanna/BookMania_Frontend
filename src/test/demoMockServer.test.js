/* eslint-disable no-undef */
import { db, localDate, resetMockDb } from "../api/mock/db";
import { handleRequest, MockError } from "../api/mock/server";

// The demo's in-browser API must behave like the real backend: same rules,
// same messages. Tokens are "demo-token:<userId>" (1 admin, 2 lector, 3 lectora con multa).
const ADMIN = "demo-token:1";
const READER = "demo-token:2";
const PENALIZED = "demo-token:3";

const call = (method, path, { token, body, params } = {}) =>
  handleRequest({ method, path, token, body, params }).body;

const errorOf = (fn) => {
  try {
    fn();
  } catch (e) {
    if (e instanceof MockError) return { status: e.status, message: e.message };
    throw e;
  }
  throw new Error("expected an error");
};

const book = (id) => call("GET", `/api/books/${id}`);

describe("servidor simulado de la demo", () => {
  beforeEach(() => resetMockDb());

  test("login con los usuarios demo y error con contraseña incorrecta", () => {
    expect(call("POST", "/api/auth/login", { body: { email: "lector@bookmania.dev", password: "demo1234" } }))
      .toMatchObject({ token: READER, role: "USER", name: "Lector Demo" });
    expect(errorOf(() => call("POST", "/api/auth/login", { body: { email: "lector@bookmania.dev", password: "x" } })))
      .toEqual({ status: 401, message: "Email o contraseña incorrectos" });
  });

  test("el catálogo filtra por título o autor, por categoría y pagina por título", () => {
    const sanderson = call("GET", "/api/books", { params: { title: "sanderson" } });
    expect(sanderson.content.map((b) => b.title)).toEqual(["Aleación de ley", "El imperio final"]);

    const page = call("GET", "/api/books", { params: { page: 1, size: 5 } });
    expect(page.totalElements).toBe(db.books.length);
    expect(page.content).toHaveLength(5);
    expect(page.totalPages).toBe(Math.ceil(db.books.length / 5));

    const scifi = call("GET", "/api/books", { params: { categoryId: 4, size: 100 } });
    expect(scifi.content.every((b) => b.categories.includes("Ciencia ficción"))).toBe(true);
  });

  test("un préstamo resta una copia y no se puede repetir el mismo libro", () => {
    const before = book(2).availableCopies;
    call("POST", "/api/loans", { token: READER, body: { bookId: 2 } });
    expect(book(2).availableCopies).toBe(before - 1);
    expect(errorOf(() => call("POST", "/api/loans", { token: READER, body: { bookId: 2 } })).message)
      .toBe("Ya tienes este libro en préstamo");
  });

  test("límite de 7 préstamos activos", () => {
    for (const id of [2, 4, 5, 7, 8]) call("POST", "/api/loans", { token: READER, body: { bookId: id } });
    // Lector Demo already had 2 → now 7
    expect(errorOf(() => call("POST", "/api/loans", { token: READER, body: { bookId: 9 } })).message)
      .toBe("Has alcanzado el límite de 7 préstamos activos simultáneos");
  });

  test("la lectora con multa no puede pedir préstamos ni reservar", () => {
    expect(errorOf(() => call("POST", "/api/loans", { token: PENALIZED, body: { bookId: 2 } })).message)
      .toMatch(/^Tienes una penalización activa hasta/);
    expect(errorOf(() => call("POST", "/api/reservations", { token: PENALIZED, body: { bookId: 3 } })).message)
      .toMatch(/No puedes hacer reservas\.$/);
  });

  test("devolver tarde genera multa y avisa al primero de la cola", () => {
    // Lectora con multa holds the only copy of book 3; Lector Demo is first in its queue
    const loan = db.loans.find((l) => l.userId === 3 && l.bookId === 3);
    loan.dueDate = localDate(-4);

    call("PUT", `/api/loans/${loan.id}/return`, { token: PENALIZED });

    expect(book(3).availableCopies).toBe(1);
    const fines = call("GET", "/api/fines/my", { token: PENALIZED });
    expect(fines.find((f) => f.loanId === loan.id)).toMatchObject({ daysOverdue: 4, penaltyDays: 34 });
    const [waiting] = call("GET", "/api/reservations/my", { token: READER });
    expect(waiting.expiryDate).toBe(localDate(3));
  });

  test("las reservas forman cola de máximo 3 y al cancelar avanzan las de detrás", () => {
    // Book 3 has no copies left; Lector Demo is position 1
    const extra1 = call("POST", "/api/auth/register", { body: { name: "Ana", email: "ana@x.com", password: "123456" } });
    const extra2 = call("POST", "/api/auth/register", { body: { name: "Bea", email: "bea@x.com", password: "123456" } });
    const extra3 = call("POST", "/api/auth/register", { body: { name: "Cris", email: "cris@x.com", password: "123456" } });

    call("POST", "/api/reservations", { token: extra1.token, body: { bookId: 3 } });
    const second = call("POST", "/api/reservations", { token: extra2.token, body: { bookId: 3 } });
    expect(second.queuePosition).toBe(3);
    expect(errorOf(() => call("POST", "/api/reservations", { token: extra3.token, body: { bookId: 3 } })).message)
      .toBe("La cola de espera está llena (máximo 3 personas).");

    const [mine] = call("GET", "/api/reservations/my", { token: READER });
    call("DELETE", `/api/reservations/${mine.id}`, { token: READER });
    expect(call("GET", "/api/reservations/my", { token: extra2.token })[0].queuePosition).toBe(2);
  });

  test("solo el admin gestiona el catálogo y sin sesión no hay datos personales", () => {
    expect(errorOf(() => call("POST", "/api/books", { token: READER, body: {} })).status).toBe(403);
    expect(errorOf(() => call("GET", "/api/loans/my")).status).toBe(401);

    const created = call("POST", "/api/books", {
      token: ADMIN,
      body: { title: "Nuevo", author: "Autora", isbn: "X-1", totalCopies: 2, categoryIds: [3] },
    });
    expect(created).toMatchObject({ availableCopies: 2, categories: ["Fantasía"] });
  });

  test("no se puede borrar un libro con historial", () => {
    expect(errorOf(() => call("DELETE", "/api/books/1", { token: ADMIN })).message)
      .toBe("No se puede eliminar el libro: tiene préstamos, reservas o multas asociadas");
  });
});
