import React from 'react';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { colors } from '../../../styles';
import { formatFileSize } from '../../../utils/fileUtils';

export default function PhotoGroupsDisplay({ groups, getGroupPhotos, editingGroupId, editingDescription, startEditGroup, saveGroupDescription, setEditingDescription, deleteGroup, removePhotoFromGroup }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ color: colors.text, marginBottom: '14px', fontSize: '14px', fontWeight: '700' }}>
        📷 Photo Groups ({groups.length})
      </h3>

      {groups.map((group, gIdx) => {
        const groupPhotos = getGroupPhotos(group);
        if (groupPhotos.length === 0) return null;
        const isEditing = editingGroupId === group.id;

        return (
          <div
            key={group.id}
            style={{
              marginBottom: '16px',
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              overflow: 'hidden',
              background: colors.surface,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: colors.surfaceAlt,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: colors.primary,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}
                >
                  {gIdx + 1}
                </span>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                    <SmartTextarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveGroupDescription();
                        if (e.key === 'Escape') startEditGroup(null, '');
                      }}
                      autoFocus
                      context="photo group description refinement"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: `1px solid ${colors.primary}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: colors.text,
                        background: colors.surface,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <button onClick={saveGroupDescription} style={{ padding: '6px 12px', background: colors.success, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => startEditGroup(null, '')} style={{ padding: '6px 10px', background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: group.description ? colors.text : colors.textMuted, fontStyle: group.description ? 'normal' : 'italic' }}>{group.description || `Photo Batch ${gIdx + 1}`}</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>{groupPhotos.length} photo{groupPhotos.length !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => startEditGroup(group.id, group.description || '')} style={{ padding: '6px 12px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✏️ Edit</button>
                  <button onClick={() => deleteGroup(group.id)} style={{ padding: '6px 12px', background: colors.danger, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>🗑 Delete Group</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '10px', padding: '14px' }}>
              {groupPhotos.map((photo) => (
                <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', overflow: 'hidden', background: colors.surface, transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' }}>
                  <div style={{ width: '100%', height: '110px', background: colors.surfaceAlt, overflow: 'hidden' }}>
                    {photo.preview ? (
                      <img src={photo.preview} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, fontSize: '11px' }}>Loading...</div>
                    )}
                  </div>

                  <div style={{ padding: '8px' }}>
                    <div style={{ fontSize: '11px', color: photo.label ? colors.text : colors.textMuted, marginBottom: '8px', lineHeight: '1.3', fontStyle: photo.label ? 'normal' : 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{photo.label || 'No individual label'}</div>

                    {photo.compressedSize && (
                      <div style={{ fontSize: '9px', color: photo.error ? colors.danger : colors.success, marginBottom: '6px', padding: '3px 5px', background: 'rgba(0,0,0,0.02)', borderRadius: '3px' }}>
                        {photo.originalSize > photo.compressedSize ? (
                          <div>
                            <div>📦 {formatFileSize(photo.compressedSize)}</div>
                            <div>↓ Saved {formatFileSize(photo.originalSize - photo.compressedSize)}</div>
                          </div>
                        ) : (
                          <div>{formatFileSize(photo.compressedSize)}</div>
                        )}
                      </div>
                    )}

                    <button onClick={() => removePhotoFromGroup(group.id, photo.id)} style={{ width: '100%', padding: '5px', background: colors.danger, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
