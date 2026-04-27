import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

export default function PhotoGrid({ photos = [] }) {
  if (!photos || photos.length === 0) {
    return <Text style={{ fontSize: 10, color: 'gray', fontStyle: 'italic', margin: 10 }}>No photos available</Text>;
  }

  return (
    <View style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      borderLeftWidth: 1, 
      borderTopWidth: 1, 
      borderColor: '#333333',
      marginTop: 5
    }}>
      {photos.map((photo, index) => {
        const src = photo.preview || photo.url;
        if (!src) return null;
        
        return (
          <View key={photo.id || index} style={{ 
            width: '50%', 
            borderRightWidth: 1, 
            borderBottomWidth: 1, 
            borderColor: '#333333' 
          }} wrap={false}>
            <View style={{ height: 160, width: '100%', overflow: 'hidden' }}>
              <Image src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </View>
            <View style={{ 
              padding: 5, 
              borderTopWidth: 1, 
              borderColor: '#333333',
              backgroundColor: '#FFFFFF',
              minHeight: 25
            }}>
              <Text style={{ fontSize: 8, lineHeight: 1.2 }}>{photo.label || 'Inspection photo'}</Text>
            </View>
          </View>
        );
      })}
      {photos.length % 2 !== 0 && (
        <View style={{ width: '50%', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#333333' }} />
      )}
    </View>
  );
}
