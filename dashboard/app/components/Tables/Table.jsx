export default function Table({ columns = [], data = [] }) {
  const hasRows = Array.isArray(data) && data.length > 0;

  if (!hasRows) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
        No records to show
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-3">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, index) => (
            <tr key={row.id ?? index} className="text-slate-700">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 align-top">
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : row[column.accessor] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
