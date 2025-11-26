export default function ErrorBox({ message }) {
    if (!message) return null;

    return (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.5em] text-rose-500">Error</p>
            <p className="mt-2 text-sm font-semibold text-rose-800">{message}</p>
        </div>
    );
}
