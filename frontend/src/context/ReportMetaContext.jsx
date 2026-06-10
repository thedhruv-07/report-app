import { createContext, useContext } from 'react';

// Populated by each report form (PSIForm, CLSForm, etc.) via <ReportMetaProvider>.
// SmartTextarea reads it to enrich AI suggestion requests with real report context.
export const ReportMetaContext = createContext({
  product: '',
  client: '',
  factory: '',
  inspectionType: '',
  inspectionDate: '',
});

export const useReportMeta = () => useContext(ReportMetaContext);
