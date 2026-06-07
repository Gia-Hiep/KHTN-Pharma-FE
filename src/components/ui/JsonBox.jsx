// File: src/components/ui/JsonBox.jsx
export function JsonBox({ data, label }) {
  return (
    <div>
      {label && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</p>}
      <pre className="json-box">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
