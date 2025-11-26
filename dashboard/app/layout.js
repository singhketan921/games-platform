import "./globals.css";

export const metadata = {
  title: "Tenant Dashboard",
  description: "Monitor tenant activity with live analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
