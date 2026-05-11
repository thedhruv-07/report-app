const libre = require('libreoffice-convert');
const util = require('util');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const convertAsync = util.promisify(libre.convert);

async function convertDocxToPdf(docxBuffer) {
  if (os.platform() === 'win32') {
    console.log('Generating PDF via MS Word local temp fallback...');
    // Use a local temp directory inside the backend folder
    // __dirname is backend/utils, so ../temp is backend/temp
    const localTempDir = path.join(__dirname, '..', 'temp');
    if (!require('fs').existsSync(localTempDir)) {
      require('fs').mkdirSync(localTempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const docxPath = path.join(localTempDir, `t_${timestamp}.docx`);
    const pdfPath = path.join(localTempDir, `t_${timestamp}.pdf`);
    const scriptPath = path.join(localTempDir, `s_${timestamp}.ps1`);
    
    const logPath = path.join(localTempDir, 'pdf_debug.log');
    const log = (msg) => require('fs').appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    
    log(`Starting PDF conversion for ${docxPath}`);
    
    try {
      await fs.writeFile(docxPath, docxBuffer);
      log('DOCX written to disk');
      
      const psScript = `
        $ErrorActionPreference = "Stop"
        try {
          $docx = "${docxPath.replace(/\\/g, '\\\\')}"
          $pdf = "${pdfPath.replace(/\\/g, '\\\\')}"
          
          $word = New-Object -ComObject Word.Application
          $word.Visible = $false
          $doc = $word.Documents.Open($docx)
          # 17 = wdFormatPDF
          $doc.SaveAs($pdf, 17)
          $doc.Close(0)
          $word.Quit()
        } catch {
          $msg = $_.Exception.Message
          Write-Error "WORD_ERROR: $msg"
          if ($word) { $word.Quit() }
          exit 1
        }
      `;
      
      await fs.writeFile(scriptPath, psScript);
      log('PS1 written to disk');
      
      return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        log('Spawning PowerShell...');
        const child = spawn('powershell.exe', [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-File', scriptPath
        ]);

        let stderr = '';
        child.stderr.on('data', (data) => { 
          stderr += data.toString(); 
          log(`PS STDERR: ${data.toString()}`);
        });

        child.on('close', async (code) => {
          log(`PS finished with code ${code}`);
          try {
            await fs.unlink(scriptPath).catch(() => {});
            await fs.unlink(docxPath).catch(() => {});
            
            if (code !== 0) {
              log(`Conversion FAILED: ${stderr}`);
              return reject(new Error(`PDF conversion failed in PowerShell: ${stderr}`));
            }
            
            const fsSync = require('fs');
            if (fsSync.existsSync(pdfPath)) {
              log('PDF created successfully');
              const pdfBuffer = await fs.readFile(pdfPath);
              await fs.unlink(pdfPath).catch(() => {});
              resolve(pdfBuffer);
            } else {
              log('PDF NOT CREATED');
              reject(new Error('PDF file was not created. Word might have failed silently.'));
            }
          } catch (cleanupError) {
            log(`Cleanup error: ${cleanupError.message}`);
            reject(cleanupError);
          }
        });
      });
    } catch (fileError) {
      log(`FS Error: ${fileError.message}`);
      throw fileError;
    }
  }

  // Fallback for non-Windows (or if we want to try LibreOffice anyway)
  try {
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    return pdfBuffer;
  } catch (err) {
    throw new Error('PDF conversion failed: LibreOffice is required on non-Windows platforms.');
  }
}

module.exports = { convertDocxToPdf };
