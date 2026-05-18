import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

import Header from './components/Header';
import Footer from './components/Footer';
import PSISections from './sections/PSISections';
import CLSSections from './sections/CLSSections';

export default function ReportPDF({ data, serviceType }) {
  const renderSections = () => {
    if (serviceType === 'cls') {
      // Pre-process CLS data to group photos for preview
      const processedData = { ...data };
      const photoGroupsConfig = [
        { id: "remarkPhotos", label: "Remarks Photos" },
        { id: "loadingAreaPhotos", label: "Loading Area Photos" },
        { id: "warehousePhotos", label: "Warehouse Photos" },
        { id: "emptyContainerPhotos", label: "Empty Container Photos" },
        { id: "truckCheckPhotos", label: "Truck Check Photos" },
        { id: "loadingPhotos", label: "Loading Process Photos" },
        { id: "closingPhotos", label: "Container Closing Photos" },
        { id: "containerPhotos", label: "Container & Seal Photos" },
        { id: "clientRequirementPhotos", label: "Client Requirement Photos" },
        { id: "generalPhotos", label: "General Photos" }
      ];

      processedData.reportPhotoGroups = photoGroupsConfig.map(group => ({
        id: group.id,
        description: group.label,
        photos: (data[group.id] || []).filter(p => p.preview).map((p, idx) => ({
          ...p,
          label: group.id === 'remarkPhotos' ? `Remark-${idx + 1}, ${p.label || 'Condition'}` : p.label
        }))
      })).filter(g => g.photos.length > 0);

      return <CLSSections data={processedData} />;
    }

    if (serviceType === 'psi') {
      return <PSISections data={data} />;
    }

    return null;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Header data={data} serviceType={serviceType} />
        {renderSections()}
        <Footer serviceType={serviceType} />
      </Page>
    </Document>
  );
}
