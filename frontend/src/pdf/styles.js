import { StyleSheet, Font } from '@react-pdf/renderer';

// We can register fonts here if needed, falling back to standard Helvetica for now
// Font.register({ family: 'Open Sans', src: '...' });

export const pdfColors = {
  primary: '#1F4E79', // Dark Blue from DOCX
  text: '#333333',
  lightGray: '#F2F2F2',
  mediumGray: '#E8E8E8',
  border: '#CCCCCC',
  success: '#228B22',
  danger: '#CC0000',
  warning: '#F39C12',
  white: '#FFFFFF'
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: pdfColors.text,
  },
  
  // Layout
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  
  // Headers
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: pdfColors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitleBox: {
    backgroundColor: pdfColors.mediumGray,
    borderWidth: 1,
    borderColor: pdfColors.border,
    padding: 6,
    marginTop: 10,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  
  // Tables
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: pdfColors.border,
    display: 'flex',
    justifyContent: 'center',
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
  },
  tableCellHeader: {
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: pdfColors.lightGray,
  },
  
  // Utilities
  bold: { fontWeight: 'bold' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  
  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  photoWrapper: {
    width: '50%',
    padding: 5,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 150,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: pdfColors.border,
  },
  photoCaption: {
    marginTop: 5,
    fontSize: 9,
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
    paddingTop: 5,
  }
});
