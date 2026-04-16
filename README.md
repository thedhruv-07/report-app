# Veritas Inspection Report App

A professional, full-stack application designed to streamline the creation of high-fidelity pre-shipment inspection reports. This tool allows inspectors to fill out a comprehensive 12-step form, upload photos, and generate a pixel-perfect Microsoft Word (.docx) report that matches corporate standards.

## 🚀 Key Features

- **Dynamic Document Generation**: Uses `docx.js` to create complex, unified tables with merged cells and professional layouts.
- **12-Step Inspection Workflow**:
  - General Information
  - Inspection Summary
  - Remarks (with auto-problem categorization)
  - Conclusion (Status-driven color coding)
  - Quantity Details
  - Workmanship & Defects (AQL Standard)
  - On-Site Tests
  - Product Specifications
  - Packing Details
  - Marking & Labeling
  - Client Special Requirements
  - Comprehensive Photo Gallery
- **Status-Driven Styling**: Automatically colors results (PASS/FAIL/PENDING) in the generated Word document.
- **Smart Data Enrichment**: Backend automatically infers missing data and calculates totals (e.g., defect counts, quantity breakdowns).
- **Responsive Dashboard**: A sleek, modern UI built with React for fast data entry.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Vanilla CSS, State-based form management.
- **Backend**: Node.js, Express, `docx` (for document assembly), `multer` (file handling).

## 📂 Project Structure

- `/server.js`: The heart of the application. Contains the report generation logic, document styling, and API endpoints.
- `/frontend/src/App.jsx`: Manages the overall application state, logic, and multi-step navigation.
- `/frontend/src/components/`: Contains modular React components for each of the 12 inspection steps.
- `/frontend/src/index.css`: Central design system with modern aesthetics and dark-mode support.

## ⚙️ Setup & Installation

### 1. Backend Setup
```bash
# From the root directory
npm install
node server.js
```
The server will run on [http://localhost:5000](http://localhost:5000).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available on [http://localhost:5173](http://localhost:5173).

## 📄 Corporate Header Standards
The generated report includes a unified single-table header containing:
- Company Logo
- Client Name (Abbr.)
- Inspection Number
- Report Date
- Conclusion Status (Red/Green/Orange)

---
*Developed for Absolute Veritas - Streamlining Professional Inspections.*
