import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { exifAPI, MetadataResponse } from '../../services/exifAPI';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

export default function EXIFViewerScreen() {
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });
        setMetadata(null); // Clear previous results
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const extractMetadata = async () => {
    if (!selectedFile) return;

    setExtracting(true);

    try {
      const response = await exifAPI.extractMetadata(
        selectedFile.uri,
        selectedFile.type,
        selectedFile.name
      );
      
      setMetadata(response);
    } catch (error: any) {
      console.error('Metadata extraction error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to extract metadata. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.details) {
          errorMessage += `\n\n${error.response.data.details}`;
        }
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Extraction Failed', errorMessage);
    } finally {
      setExtracting(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderMetadataCategory = (category: string, data: Record<string, any>) => {
    const categoryNames: Record<string, string> = {
      file: 'FILE INFORMATION',
      image: 'IMAGE INFORMATION',
      camera: 'CAMERA SETTINGS',
      gps: 'GPS LOCATION',
      video: 'VIDEO INFORMATION',
      audio: 'AUDIO INFORMATION',
      other: 'OTHER METADATA',
    };

    return (
      <View key={category} style={styles.metadataCategory}>
        <View style={styles.categoryHeader}>
          <Ionicons 
            name={category === 'gps' ? 'location' : category === 'camera' ? 'camera' : 'information-circle'} 
            size={18} 
            color={theme.neon.magenta} 
          />
          <Text style={styles.categoryTitle}>{categoryNames[category] || category.toUpperCase()}</Text>
        </View>
        <View style={styles.metadataList}>
          {Object.entries(data).map(([key, value]) => (
            <View key={key} style={styles.metadataItem}>
              <Text style={styles.metadataKey}>{key}:</Text>
              <Text style={styles.metadataValue}>{formatValue(value)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <HackerBackground opacity={0.1} speed={0.7} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="information-circle" size={24} color={theme.neon.magenta} style={styles.titleIcon} />
            <Text style={styles.sectionTitle}>EXIF VIEWER</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        {!selectedFile ? (
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={styles.pickerButton} 
              onPress={pickFile}
              activeOpacity={0.8}
            >
              <Ionicons name="document" size={24} color={theme.text.primary} style={styles.buttonIcon} />
              <Text style={styles.pickerButtonText}>SELECT FILE</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Select any file to view its metadata and EXIF data
            </Text>
          </View>
        ) : (
          <View style={styles.selectedFileContainer}>
            <View style={styles.fileInfoHeader}>
              <Ionicons name="checkmark-circle" size={20} color={theme.neon.green} />
              <Text style={styles.selectedFileLabel}>FILE SELECTED</Text>
            </View>
            <View style={styles.fileNameContainer}>
              <Text style={styles.selectedFileName} numberOfLines={2}>{selectedFile.name}</Text>
            </View>

            {!metadata ? (
              <TouchableOpacity
                style={styles.extractButton}
                onPress={extractMetadata}
                disabled={extracting}
                activeOpacity={0.8}
              >
                {extracting ? (
                  <ActivityIndicator color={theme.text.primary} />
                ) : (
                  <>
                    <Ionicons name="search" size={20} color={theme.text.primary} />
                    <Text style={styles.extractButtonText}>EXTRACT METADATA</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.neon.green} />
                  <Text style={styles.resultsTitle}>METADATA EXTRACTED</Text>
                </View>

                {metadata.fileInfo && (
                  <View style={styles.fileInfoSection}>
                    <Text style={styles.fileInfoLabel}>File: {metadata.fileInfo.originalName}</Text>
                    <Text style={styles.fileInfoLabel}>Type: {metadata.fileInfo.mimeType}</Text>
                    <Text style={styles.fileInfoLabel}>
                      Size: {(metadata.fileInfo.size / 1024).toFixed(2)} KB
                    </Text>
                  </View>
                )}

                {Object.entries(metadata.metadata).map(([category, data]) =>
                  renderMetadataCategory(category, data)
                )}

                {Object.keys(metadata.metadata).length === 0 && (
                  <View style={styles.emptyMetadata}>
                    <Ionicons name="information-circle-outline" size={48} color={theme.text.muted} />
                    <Text style={styles.emptyMetadataText}>NO METADATA FOUND</Text>
                    <Text style={styles.emptyMetadataSubtext}>
                      This file does not contain extractable metadata
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedFile(null);
                setMetadata(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={18} color={theme.status.error} />
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    padding: 20,
    zIndex: 1,
  },
  section: {
    backgroundColor: theme.bg.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border.dim,
    ...theme.shadow.magenta,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.neon.green}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.neon.green,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.neon.green,
    marginRight: 6,
    ...theme.shadow.green,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.neon.green,
    letterSpacing: 1,
  },
  pickerContainer: {
    gap: 16,
    alignItems: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.neon.magenta,
    backgroundColor: `${theme.neon.magenta}15`,
    gap: 12,
    width: '100%',
    ...theme.shadow.magenta,
  },
  buttonIcon: {
    marginRight: 0,
  },
  pickerButtonText: {
    color: theme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  helpText: {
    textAlign: 'center',
    color: theme.text.secondary,
    fontSize: 12,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
  selectedFileContainer: {
    gap: 16,
  },
  fileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedFileLabel: {
    fontSize: 12,
    color: theme.neon.green,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fileNameContainer: {
    backgroundColor: theme.bg.secondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    marginBottom: 12,
  },
  selectedFileName: {
    fontSize: 14,
    color: theme.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.neon.magenta,
    backgroundColor: `${theme.neon.magenta}20`,
    gap: 8,
    ...theme.shadow.magenta,
  },
  extractButtonText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultsContainer: {
    gap: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    color: theme.neon.green,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fileInfoSection: {
    backgroundColor: theme.bg.secondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    marginBottom: 16,
    gap: 6,
  },
  fileInfoLabel: {
    fontSize: 12,
    color: theme.text.secondary,
    letterSpacing: 0.3,
  },
  metadataCategory: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.neon.magenta,
    letterSpacing: 1,
  },
  metadataList: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.bg.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border.dim,
  },
  metadataKey: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.primary,
    minWidth: 120,
    letterSpacing: 0.3,
  },
  metadataValue: {
    flex: 1,
    fontSize: 12,
    color: theme.text.secondary,
    letterSpacing: 0.3,
  },
  emptyMetadata: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyMetadataText: {
    textAlign: 'center',
    color: theme.text.secondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyMetadataSubtext: {
    textAlign: 'center',
    color: theme.text.tertiary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
    backgroundColor: `${theme.status.error}10`,
    gap: 8,
  },
  clearButtonText: {
    color: theme.status.error,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
