import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="min-h-screen px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
