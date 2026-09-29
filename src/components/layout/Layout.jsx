import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 dark:bg-slate-900 overflow-x-hidden">
      <Navbar />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;