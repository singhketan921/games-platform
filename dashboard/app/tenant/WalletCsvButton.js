"use client";

export default function WalletCsvButton({ history = [], playerId }) {
  if (!history.length) return null;

  const handleDownload = () => {
    const header = ["transactionId", "type", "amount", "reference", "createdAt"];
    const rows = history.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      tx.reference || "",
      tx.createdAt || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wallet_${playerId || "player"}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="btn btn-sm btn-outline" onClick={handleDownload}>
      Download CSV
    </button>
  );
}
