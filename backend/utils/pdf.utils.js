/**
 * pdf.utils.js
 *
 * Root cause of slow PDF downloads:
 *   LibreOffice (Linux/prod) or MS Word via PowerShell (Windows/dev) is spawned
 *   fresh for EVERY request.  Cold-start cost: 5–20 seconds.
 *
 * Mitigations implemented here:
 *   1. Serialise conversions – only ONE LibreOffice process runs at a time.
 *      Concurrent requests queue instead of all fighting for RAM/CPU.
 *   2. Pre-warm on module load – runs `soffice --version` at startup so
 *      the binary is in the OS page cache before the first real request arrives.
 *
 * Proper long-term fix (not implemented here, needs server config):
 *   Run LibreOffice as a persistent daemon with --accept=pipe and use
 *   `unoconv --listener` so conversions take <1 s instead of 5–20 s.
 */

"use strict";

const libre = require("libreoffice-convert");
const util = require("util");
const { execFile, spawn } = require("child_process");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const os = require("os");

const convertAsync = util.promisify(libre.convert);

// ── Serialisation queue ───────────────────────────────────────────────────────
// Ensures only ONE LibreOffice (or Word) process runs at any moment.
// Without this, three simultaneous PDF requests each cold-start LibreOffice,
// tripling the wait time for all three callers.

let _busy = false;
const _queue = [];

function _drain() {
  if (_busy || _queue.length === 0) return;
  _busy = true;
  const { fn, resolve, reject } = _queue.shift();
  fn()
    .then(r => { resolve(r); _busy = false; _drain(); })
    .catch(e => { reject(e);  _busy = false; _drain(); });
}

function _serialise(fn) {
  return new Promise((resolve, reject) => {
    _queue.push({ fn, resolve, reject });
    _drain();
  });
}

// ── Linux pre-warm ────────────────────────────────────────────────────────────
// Run `soffice --version` once at startup so the LibreOffice binary and its
// shared libraries are loaded into the OS page cache.  The first real
// conversion is then faster because the OS doesn't need to read it from disk.

if (os.platform() !== "win32") {
  setImmediate(() => {
    execFile("soffice", ["--headless", "--version"], { timeout: 15000 }, (err) => {
      if (err) {
        console.warn("[pdf] LibreOffice pre-warm failed (soffice not in PATH?):", err.message);
      } else {
        console.log("[pdf] LibreOffice pre-warmed — first PDF will be faster");
      }
    });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

async function convertDocxToPdf(docxBuffer) {
  return _serialise(() => _doConvert(docxBuffer));
}

async function _doConvert(docxBuffer) {
  // ── Windows path: MS Word via PowerShell ──────────────────────────────────
  if (os.platform() === "win32") {
    console.log("[pdf] Converting via MS Word (PowerShell)…");

    const localTempDir = path.join(__dirname, "..", "temp");
    if (!fsSync.existsSync(localTempDir)) {
      fsSync.mkdirSync(localTempDir, { recursive: true });
    }

    const ts = Date.now();
    const docxPath   = path.join(localTempDir, `t_${ts}.docx`);
    const pdfPath    = path.join(localTempDir, `t_${ts}.pdf`);
    const scriptPath = path.join(localTempDir, `s_${ts}.ps1`);

    await fs.writeFile(docxPath, docxBuffer);

    const psScript = `
$ErrorActionPreference = "Stop"
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $doc = $word.Documents.Open("${docxPath.replace(/\\/g, "\\\\")}")
  $doc.SaveAs("${pdfPath.replace(/\\/g, "\\\\")}", 17)
  $doc.Close(0)
  $word.Quit()
} catch {
  if ($word) { $word.Quit() }
  Write-Error $_.Exception.Message
  exit 1
}
`;
    await fs.writeFile(scriptPath, psScript);

    return new Promise((resolve, reject) => {
      const child = spawn("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", scriptPath,
      ]);

      let stderr = "";
      child.stderr.on("data", d => { stderr += d.toString(); });

      child.on("close", async (code) => {
        await fs.unlink(scriptPath).catch(() => {});
        await fs.unlink(docxPath).catch(() => {});

        if (code !== 0) {
          return reject(new Error(`Word PDF conversion failed: ${stderr}`));
        }

        if (!fsSync.existsSync(pdfPath)) {
          return reject(new Error("Word did not produce a PDF file."));
        }

        const pdfBuf = await fs.readFile(pdfPath);
        await fs.unlink(pdfPath).catch(() => {});
        resolve(pdfBuf);
      });
    });
  }

  // ── Linux / production path: LibreOffice ─────────────────────────────────
  try {
    return await convertAsync(docxBuffer, ".pdf", undefined);
  } catch (err) {
    throw new Error(`LibreOffice PDF conversion failed: ${err.message}`);
  }
}

module.exports = { convertDocxToPdf };
