/* eslint-disable no-undef */
import { vi } from "vitest";
import axiosInstance, { RETRY_DELAY_MS } from "../api/axiosInstance";

// Stub the transport layer: each call to the adapter answers with the next
// queued status (2xx resolves, anything else rejects like axios would).
const queueResponses = (...statuses) => {
  const adapter = vi.fn((config) => {
    const status = statuses.shift();
    const response = { data: { ok: status }, status, statusText: "", headers: {}, config };
    if (status >= 200 && status < 300) return Promise.resolve(response);
    const error = new Error(`Request failed with status code ${status}`);
    error.config = config;
    error.response = response;
    error.isAxiosError = true;
    return Promise.reject(error);
  });
  axiosInstance.defaults.adapter = adapter;
  return adapter;
};

describe("axiosInstance retry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("un GET que falla con 500 se reintenta una vez y devuelve la respuesta buena", async () => {
    const adapter = queueResponses(500, 200);
    const request = axiosInstance.get("/api/books");
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    await expect(request).resolves.toMatchObject({ status: 200 });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  test("solo se reintenta una vez: un segundo fallo llega al llamador", async () => {
    const adapter = queueResponses(503, 503, 200);
    const request = axiosInstance.get("/api/books");
    const settled = request.catch((e) => e);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    expect((await settled).response.status).toBe(503);
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  test("un POST que falla no se repite", async () => {
    const adapter = queueResponses(500, 200);
    await expect(axiosInstance.post("/api/loans", {})).rejects.toMatchObject({ response: { status: 500 } });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  test("los errores de cliente (404) no se reintentan", async () => {
    const adapter = queueResponses(404, 200);
    await expect(axiosInstance.get("/api/books/999")).rejects.toMatchObject({ response: { status: 404 } });
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
