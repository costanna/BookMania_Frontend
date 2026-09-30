/* eslint-disable no-undef */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Pagination from "../components/common/Pagination";

describe("Pagination", () => {
  test("no renderiza nada si solo hay una página", () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("marca la página actual con aria-current", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 1" })).not.toHaveAttribute("aria-current");
  });

  test("deshabilita ir a anterior/primera en la primera página", () => {
    render(<Pagination currentPage={0} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Primera página" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
  });

  test("deshabilita ir a siguiente/última en la última página", () => {
    render(<Pagination currentPage={4} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Última página" })).toBeDisabled();
  });

  test("llama a onPageChange con la página correcta al hacer clic", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={0} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Página 2" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("colapsa páginas lejanas con puntos suspensivos", () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
    // primera, ...,  4,5,6 (rango alrededor de la actual, index 5 -> página 6), ..., última
    expect(screen.getByRole("button", { name: "Página 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 10" })).toBeInTheDocument();
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
  });

  test("deshabilita todos los botones mientras se está cargando una página nueva", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => {}} disabled />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
