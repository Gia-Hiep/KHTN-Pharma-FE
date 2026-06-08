export function Table({ columns = [], rows = [], keyField = 'id', emptyText = 'Không có dữ liệu' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key ?? col.label}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row[keyField] ?? i}>
                {columns.map((col) => (
                  <td key={col.key ?? col.label}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
