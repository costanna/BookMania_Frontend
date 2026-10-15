// Public demo accounts offered on the login screen. The backend creates
// (and resets) them on every startup - keep these in sync with app.demo.* in
// the backend's application.properties. The reader can use the app for
// real; the admin can browse the whole admin panel but the backend refuses
// any change it tries to make.
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  { key: "reader", email: "lector@bookmania.dev" },
  { key: "admin", email: "admin@bookmania.dev" },
];

export const DEMO_ADMIN_EMAIL = "admin@bookmania.dev";
