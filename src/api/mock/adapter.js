import { AxiosError } from "axios";
import { saveDemoDb } from "./db";
import { handleRequest, MockError } from "./server";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readHeader = (headers, name) =>
  typeof headers?.get === "function" ? headers.get(name) : headers?.[name];

const parseBody = (data) => {
  if (data == null || data === "") return null;
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

/**
 * axios adapter for the demo: instead of sending the request over the
 * network, it is answered by the in-browser mock server and the demo data is
 * saved to localStorage. Errors come back exactly like the real API's
 * (an AxiosError whose response.data.message holds the backend's text), so
 * every existing error toast and the 401 handling keep working unchanged.
 */
export const mockAdapter = async (config) => {
  await delay(120); // just enough to show the app's loading states

  const url = new URL(config.url, "http://demo.local");
  const params = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  const authorization = readHeader(config.headers, "Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  try {
    const { status, body } = handleRequest({
      method: (config.method ?? "get").toUpperCase(),
      path: url.pathname,
      params,
      body: parseBody(config.data),
      token,
    });
    saveDemoDb();
    return { data: body, status, statusText: "OK", headers: {}, config, request: {} };
  } catch (error) {
    if (!(error instanceof MockError)) throw error;
    saveDemoDb();
    const response = {
      data: { status: error.status, message: error.message, timestamp: new Date().toISOString() },
      status: error.status,
      statusText: "",
      headers: {},
      config,
      request: {},
    };
    throw new AxiosError(error.message, AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
};
