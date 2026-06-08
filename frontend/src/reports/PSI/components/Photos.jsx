import React, { useState, useEffect, lazy, Suspense } from 'react';
import { colors, buttonStyle } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { ENDPOINTS } from '../../../config/api';

const PhotoStagingPanel = lazy(() => import('./PhotoStagingPanel'));
const PhotoGroupsDisplay = lazy(() => import('./PhotoGroupsDisplay'));

function CleanupHook({ clear }) {
  useEffect(() => {
    return () => {
      try { if (typeof clear === 'function') clear(); } catch (err) { console.warn(err); }
    };
  }, [clear]);
  return null;
}

const getToken = () => {
  try { return sessionStorage.getItem('reportToken') || ''; } catch { return ''; }
};

const Photos = ({ photos = [], photoGroups = [], onPhotoGroupsChange, onPhotoFileChange, onRemovePhoto, onPrev, onNext }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [selectedPending, setSelectedPending] = useState(new Set());
  const [groupDescription, setGroupDescription] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingIndividual, setIsAnalyzingIndividual] = useState(false);
  const [selectedUngrouped, setSelectedUngrouped] = useState(new Set());
  const [ungroupedDescription, setUngroupedDescription] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    try { localStorage.removeItem('stagedPhotos'); } catch (_) {}
  }, []);

  // ── Staging handlers ──────────────────────────────────────────────────────
  const stageFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
    if (!arr.length) return;
    const readers = arr.map(file => new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve({ id: `p_${Date.now()}_${Math.random()}`, file, preview: r.result, fileName: file.name, size: file.size, label: '' });
      r.onerror = () => resolve(null);
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(results => {
      const items = results.filter(Boolean);
      if (items.length) {
        setPendingFiles(prev => [...prev, ...items]);
        setSelectedPending(prev => new Set([...Array.from(prev), ...items.map(i => i.id)]));
      }
    });
  };

  const handleFileInputChange = (e) => {
    if (e?.target?.files) stageFiles(e.target.files);
    if (e?.target) e.target.value = '';
  };

  const handleFolderInputChange = (e) => {
    if (e?.target?.files) stageFiles(e.target.files);
    if (e?.target) e.target.value = '';
  };

  const handleDrop = (e) => { e.preventDefault(); if (e.dataTransfer?.files) stageFiles(e.dataTransfer.files); };
  const handleDragEnter = (e) => e.preventDefault();
  const handleDragLeave = (e) => e.preventDefault();
  const handleDragOver = (e) => e.preventDefault();

  const handleSelectAll = () => setSelectedPending(new Set(pendingFiles.map(p => p.id)));
  const handleDeselectAll = () => setSelectedPending(new Set());
  const handleClearAll = () => { setPendingFiles([]); setSelectedPending(new Set()); };

  const handleTogglePendingSelection = (id) => setSelectedPending(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const handleRemovePendingPhoto = (id) => {
    setPendingFiles(prev => prev.filter(p => p.id !== id));
    setSelectedPending(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleUpdatePendingLabel = (id, label) => {
    setPendingFiles(prev => prev.map(p => p.id === id ? { ...p, label } : p));
  };

  // ── Group description / add to report ────────────────────────────────────
  const handleAddSelectedAsGroup = () => {
    const selected = pendingFiles.filter(p => selectedPending.has(p.id));
    if (!selected.length) return;
    onPhotoFileChange(selected, groupDescription.trim());
    setPendingFiles(prev => prev.filter(p => !selectedPending.has(p.id)));
    setSelectedPending(new Set());
    setGroupDescription('');
    setAiSuggestions([]);
  };

  // ── AI: Group Suggestions ─────────────────────────────────────────────────
  const handleAutoDescribe = async () => {
    const selected = pendingFiles.filter(p => selectedPending.has(p.id));
    if (!selected.length || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiSuggestions([]);
    try {
      const images = selected.map(p => p.preview);
      const res = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err) {
      console.error('AI group suggest error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── AI: Auto-Describe Each ────────────────────────────────────────────────
  const handleAutoDescribeEach = async () => {
    const selected = pendingFiles.filter(p => selectedPending.has(p.id));
    if (!selected.length || isAnalyzingIndividual) return;
    setIsAnalyzingIndividual(true);
    try {
      const images = selected.map(p => ({ data: p.preview, fileName: p.fileName }));
      const res = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ images, mode: 'individual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      if (suggestions.length) {
        setPendingFiles(prev => prev.map(p => {
          const idx = selected.findIndex(s => s.id === p.id);
          if (idx !== -1 && suggestions[idx]) return { ...p, label: suggestions[idx] };
          return p;
        }));
      }
    } catch (err) {
      console.error('AI individual describe error:', err);
    } finally {
      setIsAnalyzingIndividual(false);
    }
  };

  // ── Already-added photo group handlers ───────────────────────────────────
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
  const saveGroupDescription = () => {
    if (editingGroupId == null) return;
    const updated = (photoGroups || []).map(g => g.id === editingGroupId ? { ...g, description: editingDescription } : g);
    onPhotoGroupsChange(updated);
    setEditingGroupId(null);
    setEditingDescription('');
  };
  const deleteGroup = (groupId) => {
    const group = (photoGroups || []).find(g => g.id === groupId);
    if (group) (group.photoIds || []).forEach(pid => onRemovePhoto(pid));
    onPhotoGroupsChange((photoGroups || []).filter(g => g.id !== groupId));
  };
  const removePhotoFromGroup = (groupId, photoId) => {
    onRemovePhoto(photoId);
    const updated = (photoGroups || []).map(g => g.id === groupId ? { ...g, photoIds: (g.photoIds || []).filter(id => id !== photoId) } : g).filter(g => (g.photoIds || []).length > 0);
    onPhotoGroupsChange(updated);
  };

  // ── Dev globals ───────────────────────────────────────────────────────────
  const stagePreviews = (previewArray = []) => {
    if (!Array.isArray(previewArray) || previewArray.length === 0) return;
    const items = previewArray.map(p => ({ id: `p_${Date.now()}_${Math.random()}`, preview: p.preview || p, fileName: p.fileName || 'staged-image.png', size: p.size || 0, label: '' }));
    setPendingFiles(prev => [...prev, ...items]);
    setSelectedPending(prev => new Set([...Array.from(prev), ...items.map(i => i.id)]));
  };

  return (
    <div>
      <Suspense fallback={<div style={{ color: colors.textMuted, marginBottom: 12 }}>Loading photo tools…</div>}>
        <PhotoStagingPanel
          pendingFiles={pendingFiles}
          selectedPending={selectedPending}
          groupDescription={groupDescription}
          aiSuggestions={aiSuggestions}
          isAnalyzing={isAnalyzing}
          isAnalyzingIndividual={isAnalyzingIndividual}
          onFileInputChange={handleFileInputChange}
          onFolderInputChange={handleFolderInputChange}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onClearAll={handleClearAll}
          onTogglePendingSelection={handleTogglePendingSelection}
          onRemovePendingPhoto={handleRemovePendingPhoto}
          onUpdatePendingLabel={handleUpdatePendingLabel}
          onGroupDescriptionChange={setGroupDescription}
          onDismissAiSuggestions={() => setAiSuggestions([])}
          onAddSelectedAsGroup={handleAddSelectedAsGroup}
          onAutoDescribe={handleAutoDescribe}
          onAutoDescribeEach={handleAutoDescribeEach}
        />
      </Suspense>

      {typeof window !== 'undefined' && (
        <DevGlobalsHook setPendingFiles={setPendingFiles} setSelectedPending={setSelectedPending} stagePreviews={stagePreviews} />
      )}

      <CleanupHook clear={() => {
        try {
          if (typeof window !== 'undefined') {
            if (window.__stagePhotos && window.__stagePhotos === stagePreviews) delete window.__stagePhotos;
            if (window.__clearStagedPhotos) delete window.__clearStagedPhotos;
          }
        } catch (err) { console.warn(err); }
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

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
};

export default Photos;

function DevGlobalsHook({ setPendingFiles, setSelectedPending, stagePreviews }) {
  const isDev = typeof import.meta !== 'undefined' ? (import.meta.env && import.meta.env.MODE) !== 'production' : false;
  React.useEffect(() => {
    if (!isDev || typeof window === 'undefined') return;
    try {
      window.__stagePhotos = stagePreviews;
      window.__clearStagedPhotos = () => { setPendingFiles([]); setSelectedPending(new Set()); };
    } catch (err) { console.warn(err); }
    return () => {
      try {
        if (window.__stagePhotos && window.__stagePhotos === stagePreviews) delete window.__stagePhotos;
        if (window.__clearStagedPhotos) delete window.__clearStagedPhotos;
      } catch (err) { console.warn(err); }
    };
  }, [setPendingFiles, setSelectedPending, stagePreviews, isDev]);
  return null;
}
