/* eslint-disable no-undef */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import RegisterPage from "../pages/auth/RegisterPage";
import AuthProvider from "../context/AuthProvider";
import ToastProvider from "../context/ToastProvider";
import { demoNavigation, isDemoChosen } from "../api/demo";

vi.mock("../api/authService");

const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("'Probar la demo' activa la demo y lleva al login", async () => {
    const user = userEvent.setup();
    const restart = vi.spyOn(demoNavigation, "restart").mockImplementation(() => {});
    renderRegister();

    await user.click(screen.getByRole("button", { name: "Probar la demo" }));

    expect(isDemoChosen()).toBe(true);
    expect(restart).toHaveBeenCalled();
  });

  test("dentro de la demo no vuelve a ofrecerla", () => {
    localStorage.setItem("bookmania.demo", "1");
    renderRegister();

    expect(screen.queryByRole("button", { name: "Probar la demo" })).not.toBeInTheDocument();
  });
});
