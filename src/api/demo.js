// Browser-only demo: when chosen, every API call is answered inside the
// browser (see ./mock) and its data lives in this browser's localStorage, so
// the backend is never contacted - nor woken up. Changes persist between
// visits and survive switching users; "start over" brings back the
// initial data and "exit" returns to the real API.

const DEMO_FLAG_KEY = "bookmania.demo";
export const DEMO_DB_KEY = "bookmania.demo.db";
export const DEMO_PASSWORD = "demo1234";

// The accounts offered on the login screen while in the demo (their data
// lives in ./mock/db.js). Switching between them keeps everything.
export const DEMO_USERS = [
  { id: 2, key: "reader", name: "Lector Demo", email: "lector@bookmania.dev", role: "USER" },
  { id: 3, key: "penalized", name: "Lectora con multa", email: "lectora@bookmania.dev", role: "USER" },
  { id: 1, key: "admin", name: "Admin Demo", email: "admin@bookmania.dev", role: "ADMIN" },
];

const LOGIN_PATH = "/login";

// Wrapped so tests can replace the full-page navigation.
export const demoNavigation = {
  restart() {
    window.location.assign(LOGIN_PATH);
  },
};

const clearSession = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    // Nothing stored, nothing to clear
  }
};

export const isDemoChosen = () => {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
};

export const startDemo = () => {
  try {
    localStorage.setItem(DEMO_FLAG_KEY, "1");
  } catch {
    // Without storage the demo can't be remembered
  }
  clearSession();
  demoNavigation.restart();
};

export const exitDemo = () => {
  try {
    localStorage.removeItem(DEMO_FLAG_KEY);
  } catch {
    // Nothing to clear
  }
  clearSession();
  demoNavigation.restart();
};

export const resetDemo = () => {
  try {
    localStorage.removeItem(DEMO_DB_KEY);
  } catch {
    // Nothing to clear
  }
  clearSession();
  demoNavigation.restart();
};
