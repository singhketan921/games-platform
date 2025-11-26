import AdminNavbar from "./components/AdminNavbar";
import AdminSidebar from "./components/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard",
  description: "Platform Admin dashboard",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminNavbar />
          <main className="flex-1 px-6 py-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
