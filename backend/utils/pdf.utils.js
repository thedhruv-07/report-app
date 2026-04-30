const libre = require('libreoffice-convert');
const util = require('util');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const convertAsync = util.promisify(libre.convert);

async function convertDocxToPdf(docxBuffer) {
  try {
    // Try LibreOffice first (works on Linux/Render if installed, or Windows if installed)
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    return pdfBuffer;
  } catch (err) {
    // If LibreOffice fails, and we are on Windows, try PowerShell COM object as a fallback
    if (os.platform() === 'win32') {
      console.log('LibreOffice failed or not found, falling back to MS Word via PowerShell...');
      const tempDir = os.tmpdir();
      const docxPath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.docx`);
      const pdfPath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      
      await fs.writeFile(docxPath, docxBuffer);
      
      const psScript = `
        param($docxPath, $pdfPath)
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        try {
          $doc = $word.Documents.Open($docxPath)
          $doc.SaveAs([ref]$pdfPath, [ref]17)
          $doc.Close()
        } catch {
          Write-Error $_.Exception.Message
        } finally {
          $word.Quit()
        }
      `;
      
      const scriptPath = path.join(tempDir, `convert_${Date.now()}_${Math.random().toString(36).substring(7)}.ps1`);
      await fs.writeFile(scriptPath, psScript);
      
      return new Promise((resolve, reject) => {
        exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" "${docxPath}" "${pdfPath}"`, async (error, stdout, stderr) => {
          try {
            await fs.unlink(scriptPath).catch(console.error);
            await fs.unlink(docxPath).catch(console.error);
            if (error) {
              console.error('PowerShell Conversion Error:', stderr);
              return reject(error);
            }
            const pdfBuffer = await fs.readFile(pdfPath);
            await fs.unlink(pdfPath).catch(console.error);
            resolve(pdfBuffer);
          } catch (cleanupError) {
            reject(cleanupError);
          }
        });
      });
    } else {
      throw new Error('PDF conversion failed: LibreOffice is required on non-Windows platforms.');
    }
  }
}

module.exports = { convertDocxToPdf };
