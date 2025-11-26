export default function StatCard({ label, value, accent = "from-indigo-500 to-indigo-600", icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">{label}</p>
        {icon && <span className="text-2xl text-slate-900">{icon}</span>}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <div className={`mt-3 h-1 w-16 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}
