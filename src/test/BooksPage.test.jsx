/* eslint-disable no-undef */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import BooksPage from "../pages/books/BooksPage";
import bookService from "../api/bookService";
import ToastProvider from "../context/ToastProvider";

vi.mock("../api/bookService");

vi.mock("../utils/bookCover", () => ({
  getBookCover: vi.fn().mockResolvedValue(null),
}));

const mockBooks = [
  {
    id: 1,
    title: "Cien años de soledad",
    author: "Gabriel García Márquez",
    isbn: "978-0-06-088328-7",
    publishYear: 1967,
    coverUrl: null,
    totalCopies: 3,
    availableCopies: 0,
    categories: ["Ficción"],
  },
  {
    id: 2,
    title: "El nombre del viento",
    author: "Patrick Rothfuss",
    isbn: "978-8401337208",
    publishYear: 2007,
    coverUrl: null,
    totalCopies: 3,
    availableCopies: 3,
    categories: ["Ficción", "Fantasía"],
  },
];

const mockCategories = [
  { id: 2, name: "Ficción" },
  { id: 3, name: "Fantasía" },
];

const mockPagedResponse = {
  content: mockBooks,
  totalPages: 1,
  totalElements: 2,
  number: 0,
};

const renderBooksPage = () => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <BooksPage />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe("BooksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookService.getAll.mockResolvedValue(mockPagedResponse);
    bookService.getCategories.mockResolvedValue(mockCategories);
  });

  test("muestra el título del catálogo", async () => {
    renderBooksPage();
    const title = await screen.findByText("Catálogo de libros");
    expect(title).toBeInTheDocument();
  });

  test("carga y muestra los libros", async () => {
    renderBooksPage();
    await waitFor(() => {
      expect(screen.getByText("Cien años de soledad")).toBeInTheDocument();
      expect(screen.getByText("El nombre del viento")).toBeInTheDocument();
    });
  });

  test("muestra el autor de cada libro", async () => {
    renderBooksPage();
    await waitFor(() => {
      expect(screen.getByText("Gabriel García Márquez")).toBeInTheDocument();
      expect(screen.getByText("Patrick Rothfuss")).toBeInTheDocument();
    });
  });

  test("muestra disponibilidad correcta", async () => {
    renderBooksPage();
    await waitFor(() => {
      expect(screen.getByText("No disponible")).toBeInTheDocument();
      expect(screen.getByText("Disponible")).toBeInTheDocument();
    });
  });

  test("filtra libros por búsqueda de título", async () => {
    const user = userEvent.setup();
    renderBooksPage();

    await screen.findByText("Cien años de soledad");

    const input = screen.getByPlaceholderText("Buscar por título o autor...");

    bookService.getAll.mockResolvedValue({
      ...mockPagedResponse,
      content: [mockBooks[1]],
      totalElements: 1
    });

    await user.type(input, "viento");

    await waitFor(() => {
      expect(screen.queryByText("Cien años de soledad")).not.toBeInTheDocument();
      expect(screen.getByText("El nombre del viento")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test("filtra libros por búsqueda de autor", async () => {
    const user = userEvent.setup();
    renderBooksPage();

    await screen.findByText("Gabriel García Márquez");

    const input = screen.getByPlaceholderText("Buscar por título o autor...");

    bookService.getAll.mockResolvedValue({
      ...mockPagedResponse,
      content: [mockBooks[1]],
      totalElements: 1
    });

    await user.type(input, "Rothfuss");

    await waitFor(() => {
      expect(screen.queryByText("Cien años de soledad")).not.toBeInTheDocument();
      expect(screen.getByText("El nombre del viento")).toBeInTheDocument();
    });
  });

  test("filtra libros por categoría", async () => {
    const user = userEvent.setup();
    renderBooksPage();

    await screen.findByText("El nombre del viento");

    const select = screen.getByRole("combobox");

    bookService.getAll.mockResolvedValue({
      ...mockPagedResponse,
      content: [mockBooks[1]],
      totalElements: 1
    });

    await user.selectOptions(select, "Fantasía");

    await waitFor(() => {
      expect(screen.queryByText("Cien años de soledad")).not.toBeInTheDocument();
      expect(screen.getByText("El nombre del viento")).toBeInTheDocument();
    });
  });

  test("muestra mensaje cuando no hay resultados", async () => {
    const user = userEvent.setup();
    renderBooksPage();

    await screen.findByText("Cien años de soledad");

    bookService.getAll.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    const input = screen.getByPlaceholderText("Buscar por título o autor...");
    await user.type(input, "libro inexistente");

    await waitFor(() => {
      expect(screen.getByText("No se encontraron libros.")).toBeInTheDocument();
    });
  });

  test("muestra skeleton mientras carga", () => {
    bookService.getAll.mockReturnValue(new Promise(() => { }));
    bookService.getCategories.mockReturnValue(new Promise(() => { }));

    renderBooksPage();

    expect(screen.getByText("Catálogo de libros")).toBeInTheDocument();
    expect(screen.queryByText("Cien años de soledad")).not.toBeInTheDocument();
  });

  // Regression: a page changed twice while an earlier request was still in
  // flight used to snap back once that stale response finally landed (the
  // old code trusted whatever request resolved *last*, not whichever was
  // requested *last*). Reproduced here with a slow first request that
  // resolves only after a second, faster one already rendered its page.
  test("una respuesta antigua que llega tarde no pisa la página ya actualizada", async () => {
    const user = userEvent.setup();
    let resolveStale;
    const staleResponse = new Promise((resolve) => { resolveStale = resolve; });

    const page1OnlyBook = { ...mockBooks[1], id: 99, title: "Libro exclusivo de la página 2" };

    bookService.getAll
      .mockResolvedValueOnce({ ...mockPagedResponse, totalPages: 2 }) // initial mount (page 0)
      .mockResolvedValueOnce({ ...mockPagedResponse, totalPages: 2 }) // categories resolving re-runs the effect (still page 0)
      .mockReturnValueOnce(staleResponse) // triggered by the category change below (page 0), kept pending
      .mockResolvedValueOnce({ // triggered by clicking "Siguiente" right after (page 1)
        content: [page1OnlyBook],
        totalPages: 2,
        totalElements: 3,
        number: 1,
      });

    renderBooksPage();
    await screen.findByText("Cien años de soledad");

    await user.selectOptions(screen.getByRole("combobox"), "Ficción");
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    await screen.findByText("Libro exclusivo de la página 2");
    expect(screen.getByText(/página 2 de 2/i)).toBeInTheDocument();

    // The abandoned first request finally resolves - it must be ignored. Awaiting
    // it inside act() flushes the state updates it would otherwise trigger, so a
    // regression here fails deterministically instead of racing the assertion.
    resolveStale({ ...mockPagedResponse, totalPages: 2 });
    await act(async () => { await staleResponse; });

    expect(screen.getByText("Libro exclusivo de la página 2")).toBeInTheDocument();
    expect(screen.getByText(/página 2 de 2/i)).toBeInTheDocument();
  });
});