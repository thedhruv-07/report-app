import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

export default function SchemaChecklistTable({ title, items, formData, onChange, dataKey, options = ["Yes", "No", "N/A"] }) {
  const currentData = Array.isArray(formData[dataKey]) ? formData[dataKey] : [];

  const handleStatusChange = (itemId, status) => {
    const newData = [...currentData];
    const index = newData.findIndex(d => d.id === itemId);
    
    if (index !== -1) {
      newData[index] = { ...newData[index], result: status };
    } else {
      newData.push({ id: itemId, result: status });
    }
    
    onChange({ target: { name: dataKey, value: newData } });
  };

  const handleFindingChange = (itemId, finding) => {
    const newData = [...currentData];
    const index = newData.findIndex(d => d.id === itemId);
    
    if (index !== -1) {
      newData[index] = { ...newData[index], finding: finding };
    } else {
      newData.push({ id: itemId, finding: finding });
    }
    
    onChange({ target: { name: dataKey, value: newData } });
  };

  const getResult = (itemId) => {
    const found = currentData.find(d => d.id === itemId);
    return found ? found.result : "";
  };

  const getFinding = (itemId) => {
    const found = currentData.find(d => d.id === itemId);
    return found ? found.finding : "";
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
        {title}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: colors.surfaceAlt }}>
              <th style={{ padding: "10px", textAlign: "left", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px", width: "40px" }}>#</th>
              <th style={{ padding: "10px", textAlign: "left", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px" }}>Check Point</th>
              <th style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px", width: "240px" }}>Result ({options.join('/')})</th>
              <th style={{ padding: "10px", textAlign: "left", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px", width: "200px" }}>Finding / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, fontSize: "13px", background: colors.surfaceAlt, textAlign: "center" }}>{index + 1}</td>
                <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, fontSize: "13px", fontWeight: "500" }}>{item.label}</td>
                <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    {options.map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          borderRadius: "4px",
                          border: `1px solid ${getResult(item.id) === status ? colors.primary : colors.border}`,
                          background: getResult(item.id) === status ? colors.primary : "white",
                          color: getResult(item.id) === status ? "white" : colors.text,
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "6px", borderBottom: `1px solid ${colors.border}` }}>
                  <SmartTextarea
                    name={`finding_${item.id}`}
                    value={getFinding(item.id)}
                    onChange={(e) => handleFindingChange(item.id, e.target.value)}
                    placeholder="Enter findings..."
                    minHeight={32}
                    style={{ width: "100%", border: `1px solid ${colors.border}`, padding: "4px 6px", borderRadius: "4px", fontSize: "12px", background: "white" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
