import React from 'react';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { colors } from '../../../styles';

export default function DefectPhotosPanel({ defectPhotos, removeDefectPhoto, updateDefectPhoto, handleDefectPhotoUpload, addDefectPhoto }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ marginBottom: '15px', fontWeight: 'bold', color: colors.text }}>Defect Photos:</h4>

      {defectPhotos.map((photo, index) => (
        <div key={photo.id} style={{ marginBottom: '20px', padding: '15px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: '8px', position: 'relative' }}>
          <button onClick={() => removeDefectPhoto(photo.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: colors.danger, color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', zIndex: 10 }}>×</button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', alignItems: 'start' }}>
            <div style={{ position: 'relative' }}>
              <input type="file" accept="image/*" id={`defectPhotoInput-${photo.id}`} onChange={(e) => { const file = e.target.files?.[0]; handleDefectPhotoUpload(photo.id, file); }} style={{ display: 'none' }} />
              <label htmlFor={`defectPhotoInput-${photo.id}`} style={{ height: '150px', border: `2px dashed ${colors.border}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: colors.surface, transition: 'all 0.3s', color: colors.textMuted }}>
                <div style={{ textAlign: 'center', color: colors.textMuted }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '12px' }}>Click to upload</div>
                  <div style={{ fontSize: '11px', marginTop: '5px', color: colors.textMuted, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.fileName || 'No photo selected'}</div>
                </div>
              </label>

              {photo.preview && (
                <div style={{ marginTop: '8px' }}>
                  <img src={photo.preview} alt={`Defect preview ${index + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'block' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: colors.text }}>Defect Photo {index + 1} Description:</label>
              <SmartTextarea value={photo.description} onChange={(e) => updateDefectPhoto(photo.id, { description: e.target.value })} placeholder={`Describe defect photo ${index + 1}...`} context="specific defect photo description and location" style={{ minHeight: '120px' }} />
            </div>
          </div>
        </div>
      ))}

      <button onClick={addDefectPhoto} style={{ padding: '8px 15px', background: colors.primary, color: '#fff', borderRadius: '6px', border: 'none', fontSize: '12px' }}>+ Add Defect Photo</button>
    </div>
  );
}
