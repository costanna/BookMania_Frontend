/* eslint-disable no-undef */
import { render, screen } from "@testing-library/react";
import i18n from "../i18n";
import Footer from "../components/layout/Footer";

describe("Footer", () => {
  beforeEach(() => {
    i18n.changeLanguage("es");
  });

  test("muestra el año actual, el nombre de la app y el enlace al portfolio", () => {
    render(<Footer />);

    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(/BookMania/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "@costanna" });
    expect(link).toHaveAttribute("href", "https://anna-dev.vercel.app/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("traduce el texto al cambiar de idioma", async () => {
    render(<Footer />);
    expect(screen.getByText(/Hecho por/)).toBeInTheDocument();

    await i18n.changeLanguage("en");
    expect(screen.getByText(/Made by/)).toBeInTheDocument();
  });
});
