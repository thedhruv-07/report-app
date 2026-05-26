import React, { useEffect } from 'react';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { colors } from '../../../styles';

export default function PhotoStagingPanel({
  dragActive = false,
  pendingFiles = [],
  selectedPending = new Set(),
  isUploading = false,
  uploadProgress = { current: 0, total: 0 },
  groupDescription = '',
  aiSuggestions = [],
  isAnalyzing = false,
  isAnalyzingIndividual = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
  onFolderInputChange,
  onSelectAll,
  onDeselectAll,
  onClearAll,
  onTogglePendingSelection,
  onRemovePendingPhoto,
  onUpdatePendingLabel,
  onGroupDescriptionChange,
  onDismissAiSuggestions,
  onAddSelectedAsGroup,
  onAutoDescribe,
  onAutoDescribeEach,
} = {}) {
  // Ensure handlers exist to avoid runtime errors during tests
  onDragEnter = onDragEnter || (() => {});
  onDragLeave = onDragLeave || (() => {});
  onDragOver = onDragOver || (() => {});
  onDrop = onDrop || (() => {});
  onFileInputChange = onFileInputChange || (() => {});
  onFolderInputChange = onFolderInputChange || (() => {});
  onSelectAll = onSelectAll || (() => {});
  onDeselectAll = onDeselectAll || (() => {});
  onClearAll = onClearAll || (() => {});
  onTogglePendingSelection = onTogglePendingSelection || (() => {});
  onRemovePendingPhoto = onRemovePendingPhoto || (() => {});
  onUpdatePendingLabel = onUpdatePendingLabel || (() => {});
  onGroupDescriptionChange = onGroupDescriptionChange || (() => {});
  onDismissAiSuggestions = onDismissAiSuggestions || (() => {});
  onAddSelectedAsGroup = onAddSelectedAsGroup || (() => {});
  onAutoDescribe = onAutoDescribe || (() => {});
  onAutoDescribeEach = onAutoDescribeEach || (() => {});

  // Coerce and sanitize props to avoid intermittent runtime errors
  let _pendingFiles = Array.isArray(pendingFiles) ? pendingFiles : [];
  let _selectedPending = selectedPending instanceof Set ? selectedPending : new Set(Array.isArray(selectedPending) ? selectedPending : []);
  let _aiSuggestions = Array.isArray(aiSuggestions) ? aiSuggestions : [];

  useEffect(() => {
    // Minimal debug logging to capture unexpected prop shapes in CI
    if (!Array.isArray(pendingFiles) || !(selectedPending instanceof Set) || !Array.isArray(aiSuggestions)) {
      try {
        const info = {
          pendingFilesType: Object.prototype.toString.call(pendingFiles),
          selectedPendingType: Object.prototype.toString.call(selectedPending),
          aiSuggestionsType: Object.prototype.toString.call(aiSuggestions),
        };
        console.warn('PhotoStagingPanel: coerced props', info);
        // also emit an Error to capture a source-mapped stack trace in CI logs
        console.error(new Error('PhotoStagingPanel: coerced props - see warning for details'));
      } catch (err) {
        console.warn(err);
      }
    }
  }, [pendingFiles, selectedPending, aiSuggestions]);
  return (
    <>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
          borderRadius: '10px',
          padding: '28px 20px',
          background: dragActive ? 'rgba(59, 130, 246, 0.05)' : colors.surfaceAlt,
          textAlign: 'center',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ color: colors.text, margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700' }}>
            📸 Drag & Drop Images Here
          </h3>
          <p style={{ color: colors.textMuted, margin: '0 0 10px 0', fontSize: '12px' }}>
            Upload multiple photos, then select and group them with descriptions
          </p>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileInputChange}
          style={{ display: 'none' }}
          id="photoFileInput"
        />

        <label
          htmlFor="photoFileInput"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${colors.primary}, #1d4ed8)`,
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            border: 'none',
            boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            marginRight: '10px',
          }}
        >
          📷 Choose Photos
        </label>

        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          onChange={onFolderInputChange}
          style={{ display: 'none' }}
          id="folderFileInput"
        />

        <label
          htmlFor="folderFileInput"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${colors.surfaceAlt}, ${colors.border})`,
            color: colors.text,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            border: `1px solid ${colors.border}`,
          }}
        >
          📁 Upload Folder
        </label>
      </div>

          {_pendingFiles.length > 0 && (
        <div
          style={{
            marginBottom: '24px',
            border: `2px solid ${colors.warning}`,
            borderRadius: '10px',
            overflow: 'hidden',
            background: colors.surface,
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)',
          }}
        >
          {isUploading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{
                padding: '30px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}>
                <div className="spinner" style={{ marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: '#1F4E79' }}>Uploading to Cloud...</h3>
                <p style={{ margin: 0, color: '#666' }}>
                  Processing photo {uploadProgress.current} of {uploadProgress.total}
                </p>
                <div style={{
                  width: '200px',
                  height: '6px',
                  backgroundColor: '#eee',
                  borderRadius: '3px',
                  marginTop: '15px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: colors.primary,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${colors.warning}15, ${colors.warning}08)`,
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontWeight: '700', fontSize: '14px', color: colors.text }}>
                ⚠️ Photos Without Description
              </span>
              <span style={{ color: colors.textMuted, fontSize: '12px', marginLeft: '8px' }}>
                {_pendingFiles.length} photo{_pendingFiles.length !== 1 ? 's' : ''} uploaded • {_selectedPending.size} selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={onSelectAll} style={{ padding: '5px 10px', background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Select All</button>
              <button onClick={onDeselectAll} style={{ padding: '5px 10px', background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Deselect All</button>
              <button onClick={onClearAll} style={{ padding: '5px 12px', background: colors.danger, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}>Delete All</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', padding: '14px' }}>
            {_pendingFiles.map((photo) => {
              const isSelected = _selectedPending.has(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => onTogglePendingSelection(photo.id)}
                  style={{
                    border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isSelected ? `${colors.primary}08` : colors.surface,
                    position: 'relative',
                    boxShadow: isSelected ? `0 0 0 1px ${colors.primary}40` : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ position: 'absolute', top: '6px', left: '6px', width: '22px', height: '22px', borderRadius: '6px', background: isSelected ? colors.primary : 'rgba(255,255,255,0.85)', border: `2px solid ${isSelected ? colors.primary : colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', zIndex: 2, backdropFilter: 'blur(4px)', transition: 'all 0.2s ease' }}>
                    {isSelected ? '✓' : ''}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePendingPhoto(photo.id);
                    }}
                    style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, lineHeight: 1 }}
                  >
                    ×
                  </button>

                  <div style={{ width: '100%', height: '100px', overflow: 'hidden' }}>
                    <img
                      src={photo.preview}
                      alt={photo.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.8, transition: 'opacity 0.2s ease' }}
                    />
                  </div>

                    <div style={{ padding: '5px 8px 2px', fontSize: '10px', color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {photo.fileName}
                  </div>
                  <input
                    type="text"
                    placeholder="Auto or manual label..."
                    value={photo.label || ''}
                    onChange={(e) => onUpdatePendingLabel(photo.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%', padding: '6px', fontSize: '11px', border: 'none', borderTop: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              );
            })}
          </div>

          {aiSuggestions.length > 0 && (
            <div style={{ margin: '0', padding: '14px 16px', borderTop: `1px solid ${colors.border}`, background: 'linear-gradient(135deg, #6366f108, #8b5cf608)', borderLeft: '3px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#6366f1' }}>✨ AI Suggestions — click one to use it</span>
                <button onClick={onDismissAiSuggestions} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '16px', lineHeight: 1, padding: '0 4px' }} title="Dismiss suggestions">×</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {aiSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onGroupDescriptionChange(s);
                      onDismissAiSuggestions();
                    }}
                    title={s}
                    style={{ padding: '7px 14px', background: 'rgba(99,102,241,0.08)', border: '1.5px solid #6366f140', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', color: '#4f46e5', fontWeight: '500', maxWidth: '320px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s ease' }}
                  >
                    {idx + 1}. {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '14px 16px', borderTop: `1px solid ${colors.border}`, background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primary}03)`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SmartTextarea
              placeholder="Type or pick an AI suggestion for the group description..."
              value={groupDescription}
              onChange={(e) => onGroupDescriptionChange(e.target.value)}
              context="inspection photo group description"
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '13px', color: colors.text, background: colors.surface, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={onAddSelectedAsGroup}
                disabled={selectedPending.size === 0}
                style={{ padding: '10px 18px', background: selectedPending.size > 0 ? `linear-gradient(135deg, ${colors.success}, #059669)` : colors.surfaceAlt, color: selectedPending.size > 0 ? '#fff' : colors.textMuted, border: 'none', borderRadius: '8px', cursor: selectedPending.size > 0 ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700', transition: 'all 0.3s ease', boxShadow: selectedPending.size > 0 ? '0 2px 8px rgba(16,185,129,0.25)' : 'none', whiteSpace: 'nowrap' }}
              >
                ✓ Add {selectedPending.size > 0 ? `${selectedPending.size} Photo${selectedPending.size > 1 ? 's' : ''}` : 'Photos'} to Report
              </button>

              <button
                onClick={onAutoDescribe}
                disabled={selectedPending.size === 0 || isAnalyzing || isAnalyzingIndividual}
                title="Get AI group description suggestions"
                style={{ padding: '10px 16px', background: selectedPending.size > 0 && !isAnalyzing ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : colors.surfaceAlt, color: selectedPending.size > 0 && !isAnalyzing ? '#fff' : colors.textMuted, border: 'none', borderRadius: '8px', cursor: selectedPending.size > 0 && !isAnalyzing ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                {isAnalyzing ? '⏳ Thinking...' : '✨ Group Suggestions'}
              </button>

              <button
                onClick={onAutoDescribeEach}
                disabled={selectedPending.size === 0 || isAnalyzing || isAnalyzingIndividual}
                title="AI describes each photo based on its content"
                style={{ padding: '10px 16px', background: selectedPending.size > 0 && !isAnalyzingIndividual ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : colors.surfaceAlt, color: selectedPending.size > 0 && !isAnalyzingIndividual ? '#fff' : colors.textMuted, border: 'none', borderRadius: '8px', cursor: selectedPending.size > 0 && !isAnalyzingIndividual ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', boxShadow: selectedPending.size > 0 && !isAnalyzingIndividual ? '0 4px 12px rgba(236,72,153,0.3)' : 'none' }}
              >
                {isAnalyzingIndividual ? '⏳ Analyzing Photos...' : '✨ Auto-Describe Each'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
