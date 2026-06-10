import React, { useState, useRef } from 'react';
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import { ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../context/AuthContext';
import Lightbox from '../../../components/shared/Lightbox';

const SIDEBAR_W = 210;

export default function Photos({ photos = [], photoGroups = [], onPhotoGroupsChange, onPhotoFileChange, onRemovePhoto, onUpdatePhotoLabel, onPrev, onNext }) {
  const { token } = useAuth();

  const [activeGroupId, setActiveGroupId] = useState(() =>
    photoGroups.length > 0 ? photoGroups[0].id : 'all'
  );
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [describingGroupId, setDescribingGroupId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const border = '#e2e8f0';

  const getGroupPhotos = (group) =>
    (group.photoIds || []).map(pid => photos.find(p => p.id === pid)).filter(Boolean);

  const activeGroup = activeGroupId !== 'all' ? photoGroups.find(g => g.id === activeGroupId) : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const newGroup = { id: `group_${Date.now()}`, description: name, photoIds: [] };
    onPhotoGroupsChange([...photoGroups, newGroup]);
    setActiveGroupId(newGroup.id);
    setNewGroupName('');
    setAddingGroup(false);
  };

  const handleFiles = async (fileList) => {
    if (!activeGroup) return;
    const files = Array.from(fileList).filter(f => f.type?.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    try {
      await onPhotoFileChange(files, activeGroup.description, activeGroupId);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  };

  const handleAiDescribeAll = async () => {
    if (!activeGroup || describingGroupId) return;
    const gPhotos = getGroupPhotos(activeGroup);
    if (!gPhotos.length) return;
    setDescribingGroupId(activeGroupId);
    try {
      const images = gPhotos.map(p => ({ data: p.preview, fileName: p.fileName || '' }));
      const res = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ images, mode: 'individual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      suggestions.forEach((desc, i) => {
        if (desc && gPhotos[i]) onUpdatePhotoLabel(gPhotos[i].id, desc);
      });
    } catch (err) {
      console.error('AI describe error:', err);
    } finally {
      setDescribingGroupId(null);
    }
  };

  const saveGroupName = () => {
    if (!editingGroupId) return;
    onPhotoGroupsChange(photoGroups.map(g =>
      g.id === editingGroupId ? { ...g, description: editingName } : g
    ));
    setEditingGroupId(null);
    setEditingName('');
  };

  const deleteGroup = (groupId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this group and all its photos?')) return;
    const group = photoGroups.find(g => g.id === groupId);
    group?.photoIds?.forEach(pid => onRemovePhoto(pid));
    onPhotoGroupsChange(photoGroups.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) setActiveGroupId('all');
  };

  const removePhotoFromGroup = (groupId, photoId) => {
    onRemovePhoto(photoId);
    onPhotoGroupsChange(photoGroups.map(g =>
      g.id === groupId ? { ...g, photoIds: (g.photoIds || []).filter(id => id !== photoId) } : g
    ));
  };

  // ── Upload zone ────────────────────────────────────────────────────────────
  const renderUploadZone = () => (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
        borderRadius: 14,
        background: dragOver ? '#eff6ff' : '#fafbfc',
        cursor: 'pointer',
        transition: 'all 0.18s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 16px',
        minHeight: 220,
        gap: 10,
      }}
    >
      {/* Upload icon */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: dragOver ? '#dbeafe' : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#3b82f6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dragOver ? '#1d4ed8' : '#374151', marginBottom: 3 }}>
          {uploading ? 'Uploading…' : dragOver ? 'Release to upload' : 'Drop photos here'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP supported</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 200 }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 200 }}>
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          disabled={uploading}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: '1.5px solid #3b82f6', background: '#fff',
            fontSize: 12, fontWeight: 700, color: '#3b82f6',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          Choose Photos
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
          disabled={uploading}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: '1.5px solid #e2e8f0', background: '#fff',
            fontSize: 12, fontWeight: 600, color: '#64748b',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          Upload Folder
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      <input ref={folderInputRef} type="file" accept="image/*" multiple webkitdirectory="" hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );

  // ── Photo grid (2 columns) ─────────────────────────────────────────────────
  const renderPhotoGrid = (groupId, groupPhotos) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {groupPhotos.map(photo => (
        <div key={photo.id} style={{
          borderRadius: 10,
          border: `1px solid ${border}`,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Thumbnail */}
          <div
            style={{ position: 'relative', height: 160, background: '#f1f5f9', flexShrink: 0, cursor: photo.preview ? 'zoom-in' : 'default' }}
            onClick={() => photo.preview && setLightboxSrc(photo.preview)}
          >
            {photo.preview
              ? <img src={photo.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#f8fafc' }} />
              : <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }} />
            }
            {photo.preview && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              >
                <span style={{ fontSize: 20, color: '#fff', opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                >🔍</span>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); removePhotoFromGroup(groupId, photo.id); }}
              title="Remove photo"
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 22, height: 22, borderRadius: '50%',
                border: 'none', background: 'rgba(15,23,42,0.6)', color: '#fff',
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(2px)',
              }}
            >×</button>
          </div>
          {/* Description */}
          <div style={{ padding: '6px 8px' }}>
            <textarea
              value={photo.label || ''}
              onChange={(e) => onUpdatePhotoLabel(photo.id, e.target.value)}
              placeholder="Add description…"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontSize: 11, padding: '4px 6px',
                border: `1px solid ${photo.label ? '#86efac' : border}`,
                borderRadius: 6, resize: 'none',
                fontFamily: 'inherit', color: '#374151',
                background: photo.label ? '#f0fdf4' : '#f8fafc',
                outline: 'none', lineHeight: 1.4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Group header ───────────────────────────────────────────────────────────
  const renderGroupHeader = () => {
    if (!activeGroup) return null;
    const isDescribing = describingGroupId === activeGroupId;
    const gPhotos = getGroupPhotos(activeGroup);
    const groupIdx = photoGroups.findIndex(g => g.id === activeGroup.id);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#3b82f6', color: '#fff',
          fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{groupIdx + 1}</span>

        {editingGroupId === activeGroup.id ? (
          <>
            <input autoFocus value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGroupName(); if (e.key === 'Escape') setEditingGroupId(null); }}
              style={{ flex: 1, fontSize: 14, fontWeight: 700, padding: '3px 8px', border: '1px solid #93c5fd', borderRadius: 6, outline: 'none', color: '#1e293b', fontFamily: 'inherit' }}
            />
            <button onClick={saveGroupName} style={{ padding: '3px 12px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setEditingGroupId(null)} style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${border}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
              {activeGroup.description || `Group ${groupIdx + 1}`}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>{gPhotos.length} photo{gPhotos.length !== 1 ? 's' : ''}</span>

            {gPhotos.length > 0 && (
              <button onClick={handleAiDescribeAll} disabled={isDescribing} style={{
                padding: '4px 11px', borderRadius: 7,
                border: '1px solid #c4b5fd',
                background: isDescribing ? '#ede9fe' : '#faf5ff',
                color: '#7c3aed', fontSize: 11, fontWeight: 700,
                cursor: isDescribing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {isDescribing
                  ? <><span style={{ width: 10, height: 10, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> Describing…</>
                  : <><span style={{ fontSize: 12 }}>✨</span> AI Describe</>
                }
              </button>
            )}

            <button onClick={() => { setEditingGroupId(activeGroup.id); setEditingName(activeGroup.description || ''); }}
              style={{ padding: '4px 9px', borderRadius: 6, border: `1px solid ${border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: '#64748b' }}>
              Rename
            </button>
            <button onClick={(e) => deleteGroup(activeGroup.id, e)}
              style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#ef4444' }}>
              Delete
            </button>
          </>
        )}
      </div>
    );
  };

  // ── All view ───────────────────────────────────────────────────────────────
  const renderAllView = () => (
    <div>
      {photoGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No photo groups yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Add a group from the left panel, then upload photos to it.</div>
        </div>
      ) : (
        photoGroups.map((group, idx) => {
          const gPhotos = getGroupPhotos(group);
          return (
            <div key={group.id} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: idx < photoGroups.length - 1 ? `1px solid ${border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{group.description || `Group ${idx + 1}`}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', borderRadius: 8, padding: '1px 8px' }}>{gPhotos.length}</span>
              </div>
              {gPhotos.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 30, fontStyle: 'italic' }}>No photos — click the group on the left to upload.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6, paddingLeft: 30 }}>
                  {gPhotos.map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => photo.preview && setLightboxSrc(photo.preview)}
                      style={{ borderRadius: 7, overflow: 'hidden', aspectRatio: '1', background: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: photo.preview ? 'zoom-in' : 'default' }}
                    >
                      {photo.preview && <img src={photo.preview} alt={photo.label || ''} title={photo.label || ''} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#f8fafc' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // ── Group view ─────────────────────────────────────────────────────────────
  const renderGroupView = () => {
    const gPhotos = activeGroup ? getGroupPhotos(activeGroup) : [];
    return (
      <div>
        {renderGroupHeader()}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Upload zone — left/centre */}
          <div style={{ flex: '0 0 38%' }}>
            {renderUploadZone()}
          </div>
          {/* Photo grid — right */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {gPhotos.length > 0
              ? renderPhotoGrid(activeGroup.id, gPhotos)
              : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: '#94a3b8', gap: 6 }}>
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  <span style={{ fontSize: 13 }}>Photos will appear here</span>
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  };

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        display: 'flex',
        border: `1px solid ${border}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        minHeight: 440,
        marginBottom: 20,
      }}>

        {/* ── Sidebar ── */}
        <div style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

          {/* Header label */}
          <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Photo Groups</span>
          </div>

          {/* All */}
          <div
            onClick={() => setActiveGroupId('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer',
              background: activeGroupId === 'all' ? '#eff6ff' : 'transparent',
              borderLeft: activeGroupId === 'all' ? '3px solid #3b82f6' : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: activeGroupId === 'all' ? '#1d4ed8' : '#475569', flex: 1 }}>All Photos</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: activeGroupId === 'all' ? '#dbeafe' : '#e2e8f0', color: activeGroupId === 'all' ? '#1d4ed8' : '#64748b', borderRadius: 10, padding: '1px 7px' }}>{photos.length}</span>
          </div>

          {photoGroups.length > 0 && <div style={{ height: 1, background: border, margin: '2px 0' }} />}

          {/* Group list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {photoGroups.map((group, idx) => {
              const count = (group.photoIds || []).length;
              const isActive = activeGroupId === group.id;
              return (
                <div
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', cursor: 'pointer',
                    background: isActive ? '#eff6ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? '#3b82f6' : '#e2e8f0',
                    color: isActive ? '#fff' : '#64748b',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{idx + 1}</span>
                  <span style={{
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#1d4ed8' : '#475569',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={group.description}>
                    {group.description || `Group ${idx + 1}`}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? '#dbeafe' : '#e2e8f0', color: isActive ? '#1d4ed8' : '#64748b', borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Add group */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}` }}>
            {addingGroup ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  autoFocus value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup(); if (e.key === 'Escape') { setAddingGroup(false); setNewGroupName(''); } }}
                  placeholder="Group name…"
                  style={{ width: '100%', fontSize: 12, padding: '6px 9px', border: '1.5px solid #93c5fd', borderRadius: 7, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b' }}
                />
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={handleCreateGroup} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                  <button onClick={() => { setAddingGroup(false); setNewGroupName(''); }} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${border}`, background: '#fff', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingGroup(true)} style={{
                width: '100%', padding: '7px 0', borderRadius: 8,
                border: '1.5px dashed #93c5fd', background: '#eff6ff',
                color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                + Add Group
              </button>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto', maxHeight: 580 }}>
          {activeGroupId === 'all' ? renderAllView() : renderGroupView()}
        </div>
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
