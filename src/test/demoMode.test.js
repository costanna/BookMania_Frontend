/* eslint-disable no-undef */
import { vi } from "vitest";
import { DEMO_DB_KEY, demoNavigation, exitDemo, isDemoChosen, resetDemo, startDemo } from "../api/demo";
import { mockAdapter } from "../api/mock/adapter";
import { resetMockDb } from "../api/mock/db";

describe("modo demo", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDb();
    vi.spyOn(demoNavigation, "restart").mockImplementation(() => {});
  });

  test("entrar, empezar de cero y salir cierran la sesión y recargan en el login", () => {
    localStorage.setItem("token", "real-token");
    startDemo();
    expect(isDemoChosen()).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();

    localStorage.setItem(DEMO_DB_KEY, "{}");
    resetDemo();
    expect(localStorage.getItem(DEMO_DB_KEY)).toBeNull();
    expect(isDemoChosen()).toBe(true);

    exitDemo();
    expect(isDemoChosen()).toBe(false);
    expect(demoNavigation.restart).toHaveBeenCalledTimes(3);
  });

  test("los cambios hechos en la demo se guardan en el navegador", async () => {
    localStorage.setItem("bookmania.demo", "1");

    await mockAdapter({
      method: "post", url: "/api/loans", data: JSON.stringify({ bookId: 2 }),
      headers: { Authorization: "Bearer demo-token:2" },
    });

    const saved = JSON.parse(localStorage.getItem(DEMO_DB_KEY));
    expect(saved.db.loans.some((l) => l.userId === 2 && l.bookId === 2 && l.status === "ISSUED")).toBe(true);
  });

  test("los errores llegan como los de la API real (response.data.message)", async () => {
    await expect(mockAdapter({
      method: "post", url: "/api/loans", data: JSON.stringify({ bookId: 2 }),
      headers: { Authorization: "Bearer demo-token:3" },
    })).rejects.toMatchObject({
      response: { status: 400, data: { message: expect.stringMatching(/^Tienes una penalización activa/) } },
    });
  });
});
