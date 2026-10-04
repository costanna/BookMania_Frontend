/* eslint-disable no-undef */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import LoginPage from "../pages/auth/LoginPage";
import AuthProvider from "../context/AuthProvider";
import ToastProvider from "../context/ToastProvider";
import authService from "../api/authService";

vi.mock("../api/authService");

const renderLoginAt = (path) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>Catálogo</p>} />
            <Route path="/my-loans" element={<p>Mis préstamos</p>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  test("avisa cuando la sesión ha caducado (flag dejado por axiosInstance en un 401)", () => {
    sessionStorage.setItem("session_expired", "1");
    renderLoginAt("/login");

    expect(screen.getByText("Tu sesión ha caducado. Inicia sesión de nuevo.")).toBeInTheDocument();
    // The flag is one-shot: a later mount (e.g. after a normal logout) must
    // not show the toast again.
    expect(sessionStorage.getItem("session_expired")).toBeNull();
  });

  test("no muestra el aviso de sesión caducada en un login normal", () => {
    renderLoginAt("/login");
    expect(screen.queryByText("Tu sesión ha caducado. Inicia sesión de nuevo.")).not.toBeInTheDocument();
  });

  test("tras iniciar sesión vuelve a la página que se quería visitar (?redirect=)", async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ email: "a@a.com", role: "USER", name: "Anna", token: "tok" });

    renderLoginAt("/login?redirect=%2Fmy-loans");

    await user.type(screen.getByLabelText("Email"), "a@a.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("Mis préstamos")).toBeInTheDocument();
    });
  });

  test("sin ?redirect= vuelve al catálogo", async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ email: "a@a.com", role: "USER", name: "Anna", token: "tok" });

    renderLoginAt("/login");

    await user.type(screen.getByLabelText("Email"), "a@a.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("Catálogo")).toBeInTheDocument();
    });
  });

  test("las etiquetas están vinculadas a sus campos", () => {
    renderLoginAt("/login");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "login-email");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("id", "login-password");
  });

  test("el botón del ojo muestra y vuelve a ocultar la contraseña", async () => {
    const user = userEvent.setup();
    renderLoginAt("/login");
    const input = screen.getByLabelText("Contraseña");
    await user.type(input, "secret");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("secret");

    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
