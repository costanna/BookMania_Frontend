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

  // A page/search/filter change used to give no feedback at all while the new
  // results were in flight - the old list just sat there, unchanged, for
  // however long the request took, which read as the click not having
  // worked. The existing books should stay on screen (not replaced by the
  // skeleton, which is for the very first load only) with a visible cue that
  // something is happening.
  test("muestra un indicador de carga sin ocultar los libros al cambiar de página", async () => {
    const user = userEvent.setup();
    let resolveSearch;
    renderBooksPage();
    await screen.findByText("Cien años de soledad");

    bookService.getAll.mockReturnValue(new Promise((resolve) => { resolveSearch = resolve; }));

    await user.type(screen.getByPlaceholderText("Buscar por título o autor..."), "v", { delay: null });

    await waitFor(() => {
      expect(screen.getByText("Actualizando…")).toBeInTheDocument();
    });
    expect(screen.getByText("Cien años de soledad")).toBeInTheDocument();

    resolveSearch({ ...mockPagedResponse, content: [mockBooks[1]], totalElements: 1 });

    await waitFor(() => {
      expect(screen.queryByText("Actualizando…")).not.toBeInTheDocument();
    });
  });

  // Regression: categories load independently of the books list, and once
  // they resolve they re-run the same effect that fetches books - a second,
  // parallel request for whatever page was current at mount. If the very
  // first (mount) request was merely slower, not superseded by anything the
  // user did, it could still land *after* that second request and overwrite
  // its result with stale data. Reproduced here without any pagination click
  // (now disabled while loading anyway) - purely the mount-time race between
  // the books and categories requests.
  test("una petición de montaje que tarda más no pisa la respuesta más reciente", async () => {
    let resolveMountRequest;
    const mountRequest = new Promise((resolve) => { resolveMountRequest = resolve; });

    const staleBook = { ...mockBooks[0], id: 100, title: "Libro obsoleto de la petición lenta" };
    const freshBook = { ...mockBooks[1], id: 101, title: "Libro fresco de la segunda petición" };

    bookService.getAll
      .mockReturnValueOnce(mountRequest) // initial mount (page 0), kept pending on purpose
      .mockResolvedValueOnce({ // categories resolving (fast) re-runs the effect before the mount request settles
        content: [freshBook],
        totalPages: 1,
        totalElements: 1,
        number: 0,
      });

    renderBooksPage();
    await screen.findByText("Libro fresco de la segunda petición");

    // The slower mount-time request finally resolves - it must be ignored,
    // since a newer request already started (and finished) after it.
    resolveMountRequest({ content: [staleBook], totalPages: 1, totalElements: 1, number: 0 });
    await act(async () => { await mountRequest; });

    expect(screen.getByText("Libro fresco de la segunda petición")).toBeInTheDocument();
    expect(screen.queryByText("Libro obsoleto de la petición lenta")).not.toBeInTheDocument();
  });
});