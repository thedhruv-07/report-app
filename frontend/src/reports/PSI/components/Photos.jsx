import React, { useState, useEffect, lazy, Suspense } from 'react';
import { colors, buttonStyle } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const PhotoStagingPanel = lazy(() => import('./PhotoStagingPanel'));
const PhotoGroupsDisplay = lazy(() => import('./PhotoGroupsDisplay'));

// Small cleanup hook component to run a clear function on unmount
function CleanupHook({ clear }) {
  useEffect(() => {
    return () => {
      try { if (typeof clear === 'function') clear(); } catch (e) {}
    };
  }, [clear]);
  return null;
}

const Photos = ({ photos = [], photoGroups = [], onPhotoGroupsChange, onPhotoFileChange, onRemovePhoto, onPrev, onNext }) => {
  const initialStaged = (() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('stagedPhotos') : null;
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  })();

  const [pendingFiles, setPendingFiles] = useState(initialStaged);
  const [pendingPreviews, setPendingPreviews] = useState(initialStaged);
  const [selectedPending, setSelectedPending] = useState(new Set(initialStaged.map(p => p.id)));
  const [selectedUngrouped, setSelectedUngrouped] = useState(new Set());
  const [ungroupedDescription, setUngroupedDescription] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    if (pendingPreviews.length > 0) localStorage.setItem('stagedPhotos', JSON.stringify(pendingPreviews)); else localStorage.removeItem('stagedPhotos');
  }, [pendingPreviews]);

  const getGroupPhotos = (group) => (group.photoIds || []).map(pid => photos.find(p => p.id === pid)).filter(Boolean);
  const getUngroupedPhotos = () => {
    if (!photoGroups || photoGroups.length === 0) return photos;
    const grouped = new Set(photoGroups.flatMap(g => g.photoIds || []));
    return photos.filter(p => !grouped.has(p.id));
  };

  const ungroupedPhotos = getUngroupedPhotos();

  const toggleUngroupedSelection = (id) => setSelectedUngrouped(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const groupUngroupedPhotos = () => {
    if (selectedUngrouped.size === 0) return;
    const g = { id: `group_${Date.now()}`, description: ungroupedDescription.trim() || '', photoIds: Array.from(selectedUngrouped) };
    onPhotoGroupsChange([...(photoGroups || []), g]);
    setSelectedUngrouped(new Set());
    setUngroupedDescription('');
  };

  const startEditGroup = (groupId, desc) => { setEditingGroupId(groupId); setEditingDescription(desc || ''); };
  const saveGroupDescription = () => { if (editingGroupId == null) return; const updated = (photoGroups || []).map(g => g.id === editingGroupId ? { ...g, description: editingDescription } : g); onPhotoGroupsChange(updated); setEditingGroupId(null); setEditingDescription(''); };
  const deleteGroup = (groupId) => { const group = (photoGroups || []).find(g => g.id === groupId); if (group) (group.photoIds || []).forEach(pid => onRemovePhoto(pid)); onPhotoGroupsChange((photoGroups || []).filter(g => g.id !== groupId)); };
  const removePhotoFromGroup = (groupId, photoId) => { onRemovePhoto(photoId); const updated = (photoGroups || []).map(g => g.id === groupId ? { ...g, photoIds: (g.photoIds || []).filter(id => id !== photoId) } : g).filter(g => (g.photoIds || []).length > 0); onPhotoGroupsChange(updated); };

  const stageFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
    if (!arr.length) return;
    const readers = arr.map(file => new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve({ id: `p_${Date.now()}_${Math.random()}`, file, preview: r.result, fileName: file.name, size: file.size }); r.onerror = () => resolve(null); r.readAsDataURL(file); }));
    Promise.all(readers).then(results => { const items = results.filter(Boolean); if (items.length) { setPendingFiles(prev => [...prev, ...items]); setPendingPreviews(prev => [...prev, ...items]); setSelectedPending(prev => new Set([...Array.from(prev), ...items.map(i => i.id)])); } });
  };

  const handleFileInputChange = (e) => {
    const files = e && e.target && e.target.files ? e.target.files : null;
    if (files) stageFiles(files);
    // clear input to allow re-uploading same file
    if (e && e.target) e.target.value = '';
  };

  const handleFolderInputChange = (e) => {
    const files = e && e.target && e.target.files ? e.target.files : null;
    if (files) stageFiles(files);
    if (e && e.target) e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) stageFiles(e.dataTransfer.files);
  };

  const handleDragEnter = (e) => e.preventDefault();
  const handleDragLeave = (e) => e.preventDefault();
  const handleDragOver = (e) => e.preventDefault();

  // Programmatic staging API for automated tests / external callers
  const stagePreviews = (previewArray = []) => {
    if (!Array.isArray(previewArray) || previewArray.length === 0) return;
    const items = previewArray.map((p) => ({ id: `p_${Date.now()}_${Math.random()}`, preview: p.preview || p, fileName: p.fileName || 'staged-image.png', size: p.size || 0 }));
    setPendingFiles((prev) => [...prev, ...items]);
    setPendingPreviews((prev) => [...prev, ...items]);
    setSelectedPending((prev) => new Set([...Array.from(prev), ...items.map(i => i.id)]));
  };

  return (
    <div>
      <Suspense fallback={<div style={{ color: colors.textMuted, marginBottom: 12 }}>Loading photo tools…</div>}>
        <PhotoStagingPanel
          pendingFiles={pendingFiles}
          pendingPreviews={pendingPreviews}
          selectedPending={selectedPending}
          setSelectedPending={setSelectedPending}
          onFileInputChange={handleFileInputChange}
          onFolderInputChange={handleFolderInputChange}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          stageFiles={stageFiles}
          onAddSelected={(selected, description) => onPhotoFileChange(selected, description)}
          clearPending={() => { setPendingFiles([]); setPendingPreviews([]); setSelectedPending(new Set()); }}
        />
      </Suspense>

      {/* Expose staging helpers for automated scripts (non-production only). Clean up on unmount. */}
      {typeof window !== 'undefined' && (() => {
        // Attach in a micro-effect so server-side rendering avoids touching window
        try {
          // Only expose in non-production builds to avoid global leaks in prod
          if (process.env.NODE_ENV !== 'production') {
            window.__stagePhotos = stagePreviews;
            window.__clearStagedPhotos = () => { setPendingFiles([]); setPendingPreviews([]); setSelectedPending(new Set()); localStorage.removeItem('stagedPhotos'); };
          }
        } catch (e) {}
        // provide a cleanup via a no-op return; actual cleanup handled in effect below
        return null;
      })()}

      {/* Ensure globals are removed on unmount (defensive cleanup) */}
      <CleanupHook clear={() => {
        try {
          if (typeof window !== 'undefined') {
            if (window.__stagePhotos && window.__stagePhotos === stagePreviews) delete window.__stagePhotos;
            if (window.__clearStagedPhotos) delete window.__clearStagedPhotos;
          }
        } catch (e) {}
      }} />

      {photoGroups && photoGroups.length > 0 && (
        <Suspense fallback={<div style={{ marginBottom: '20px', color: colors.textMuted }}>Loading photo groups…</div>}>
          <PhotoGroupsDisplay
            groups={photoGroups}
            getGroupPhotos={getGroupPhotos}
            editingGroupId={editingGroupId}
            editingDescription={editingDescription}
            startEditGroup={startEditGroup}
            saveGroupDescription={saveGroupDescription}
            setEditingDescription={setEditingDescription}
            deleteGroup={deleteGroup}
            removePhotoFromGroup={removePhotoFromGroup}
          />
        </Suspense>
      )}

      {ungroupedPhotos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: colors.text }}>⚠️ Photos Without Description</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelectedUngrouped(new Set(ungroupedPhotos.map(p => p.id)))} style={{ ...buttonStyle, padding: '6px 10px' }}>Select All</button>
              <button onClick={() => setSelectedUngrouped(new Set())} style={{ ...buttonStyle, padding: '6px 10px' }}>Deselect All</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {ungroupedPhotos.map(photo => (
              <div key={photo.id} onClick={() => toggleUngroupedSelection(photo.id)} style={{ border: `2px solid ${selectedUngrouped.has(photo.id) ? '#f59e0b' : colors.border}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ width: '100%', height: 100, overflow: 'hidden' }}>
                  {photo.preview ? <img src={photo.preview} alt="ungrouped" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: colors.textMuted }}>Loading...</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <SmartTextarea value={ungroupedDescription} onChange={(e) => setUngroupedDescription(e.target.value)} placeholder="Enter description for selected photos..." style={{ flex: 1 }} />
            <button onClick={groupUngroupedPhotos} style={{ ...buttonStyle, padding: '10px 14px' }}>✓ Add Description</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, padding: 14, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textMuted }}>
        <strong style={{ color: colors.text }}>💡 How it works:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          <li>Upload photos — they appear in the Staging Area</li>
          <li>Select photos you want to group (click to select/deselect)</li>
          <li>Add a description and click "Add Photos to Report"</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onPrev} style={{ ...buttonStyle, minWidth: 110 }}>Previous</button>
        <button onClick={onNext} style={{ ...buttonStyle, minWidth: 110 }}>Next</button>
      </div>
    </div>
  );
};

export default Photos;
