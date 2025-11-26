import Table from "../Tables/Table";

export default function CallbackCard({ callbacks = [] }) {
  const rows = callbacks.map((callback) => {
    const createdAt = callback.endedAt || callback.startedAt;
    const delta =
      callback.startedAt && callback.endedAt
        ? `${Math.round((new Date(callback.endedAt).getTime() - new Date(callback.startedAt).getTime()) / 1000)}s`
        : "pending";

    return {
      id: callback.id,
      sessionId: callback.id,
      delta,
      createdAt,
    };
  });

  const columns = [
    { header: "Callback ID", accessor: "id" },
    { header: "Session ID", accessor: "sessionId" },
    { header: "Delta", accessor: "delta" },
    {
      header: "Created At",
      accessor: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Callback Logs</p>
          <h3 className="text-xl font-semibold text-slate-900">Recent callbacks</h3>
        </div>
      </div>
      <div className="mt-4">
        <Table columns={columns} data={rows} />
      </div>
    </div>
  );
}
