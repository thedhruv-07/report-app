/**
 * Compress image to target file size (5KB-10KB)
 * @param {File} file - Image file to compress
 * @param {number} targetSize - Target size in bytes (default 7500 = ~7.5KB)
 * @returns {Promise<{file: File, preview: string, originalSize: number, compressedSize: number}>}
 */
export const compressImage = async (file, targetSize = 7500) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Start with full resolution
        let quality = 0.85;
        let iterations = 0;
        const maxIterations = 10;
        
        const attemptCompress = () => {
          iterations++;
          
          // Resize canvas and draw image
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              const blobSize = blob.size;
              
              // If size is good, resolve
              if (blobSize <= targetSize || iterations >= maxIterations) {
                // Create preview
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = 200;
                previewCanvas.height = 150;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.fillStyle = '#fff';
                previewCtx.fillRect(0, 0, 200, 150);
                
                // Calculate aspect ratio for preview
                const imgAspect = img.width / img.height;
                const canvasAspect = 200 / 150;
                
                let drawWidth, drawHeight, drawX, drawY;
                if (imgAspect > canvasAspect) {
                  drawHeight = 150;
                  drawWidth = 150 * imgAspect;
                  drawX = (200 - drawWidth) / 2;
                  drawY = 0;
                } else {
                  drawWidth = 200;
                  drawHeight = 200 / imgAspect;
                  drawX = 0;
                  drawY = (150 - drawHeight) / 2;
                }
                previewCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                const preview = previewCanvas.toDataURL('image/jpeg', 0.8);
                
                // Create compressed file
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.jpg'),
                  { type: 'image/jpeg' }
                );
                
                resolve({
                  file: compressedFile,
                  preview: preview,
                  originalSize: file.size,
                  compressedSize: blob.size
                });
              } else if (blobSize > targetSize) {
                // If still too large, reduce quality or dimensions
                if (quality > 0.3) {
                  quality -= 0.15;
                  attemptCompress();
                } else if (width > 400) {
                  // Reduce dimensions
                  quality = 0.85;
                  width = Math.round(width * 0.8);
                  height = Math.round(height * 0.8);
                  attemptCompress();
                } else {
                  // Give up, return what we have
                  const preview = canvas.toDataURL('image/jpeg', 0.8);
                  const compressedFile = new File(
                    [blob],
                    file.name.replace(/\.[^.]+$/, '.jpg'),
                    { type: 'image/jpeg' }
                  );
                  
                  resolve({
                    file: compressedFile,
                    preview: preview,
                    originalSize: file.size,
                    compressedSize: blob.size
                  });
                }
              } else {
                attemptCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        attemptCompress();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes to human readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
