import React from 'react';
import { colors, tableHeaderStyle, tableCellStyle } from '../../../styles';

export default function AuditOverview({ form, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "10px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
        2. General overview of audit
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "14px" }}>
        <thead>
          <tr style={{ background: colors.headerBg }}>
            <th style={{ ...tableHeaderStyle, width: "50px" }}>#</th>
            <th style={{ ...tableHeaderStyle, textAlign: "left" }}>Fields</th>
            <th style={{ ...tableHeaderStyle, width: "100px" }}>Score /10</th>
            <th style={{ ...tableHeaderStyle, width: "100px" }}>Weight /5</th>
            <th style={{ ...tableHeaderStyle, width: "120px" }}>Weighted score</th>
          </tr>
        </thead>
        <tbody>
          {schema.auditOverview.sections.map((sec, idx) => {
            const score = form.auditOverview?.[sec.id] || 0;
            const weight = form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight;
            const weighted = form.auditOverview?.[`${sec.id}_weighted`] ?? (score * weight);
            return (
              <tr key={sec.id}>
                <td style={{ ...tableCellStyle, textAlign: "center" }}>{idx + 1}</td>
                <td style={tableCellStyle}>{sec.label}</td>
                <td style={{ ...tableCellStyle, padding: "5px" }}>
                  <input 
                    type="number" min="0" max="10" 
                    value={score} 
                    onChange={(e) => {
                      const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                      setForm(prev => ({ ...prev, auditOverview: { ...prev.auditOverview, [sec.id]: val } }));
                    }}
                    style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "600" }}
                  />
                </td>
                <td style={{ ...tableCellStyle, padding: "5px", background: colors.surfaceAlt }}>
                  <input 
                    type="number" min="0" max="10" 
                    value={weight} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm(prev => ({ ...prev, auditOverview: { ...prev.auditOverview, [`${sec.id}_weight`]: val } }));
                    }}
                    style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "600" }}
                  />
                </td>
                <td style={{ ...tableCellStyle, padding: "5px" }}>
                  <input 
                    type="number" value={weighted} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm(prev => ({ ...prev, auditOverview: { ...prev.auditOverview, [`${sec.id}_weighted`]: val } }));
                    }}
                    style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "700" }}
                  />
                </td>
              </tr>
            );
          })}
          <tr style={{ background: colors.surfaceAlt }}>
            <td colSpan="3" style={{ ...tableCellStyle, textAlign: "right", fontWeight: "bold" }}>Total:</td>
            <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "bold" }}>
              {schema.auditOverview.sections.reduce((acc, sec) => acc + (form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight), 0)}
            </td>
            <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "bold" }}>
              {schema.auditOverview.sections.reduce((acc, sec) => {
                const s = form.auditOverview?.[sec.id] || 0;
                const w = form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight;
                return acc + (form.auditOverview?.[`${sec.id}_weighted`] ?? (s * w));
              }, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
