import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
// import * as ImageManipulator from 'expo-image-manipulator'; // Not available in Expo Go
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { pdfAPI, FileConversion } from '../../services/pdfAPI';
import { convertImageToPDFClient, canConvertClientSide } from '../../utils/pdfConverter';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function PDFConvertScreen() {
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [converting, setConverting] = useState(false);
  const [conversionMethod, setConversionMethod] = useState<'client' | 'server' | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [conversions, setConversions] = useState<FileConversion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversionHistory();
    }
  }, [isAuthenticated]);

  const loadConversionHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await pdfAPI.getConversions();
      setConversions(response.conversions);
    } catch (error: any) {
      console.error('Failed to load conversion history:', error);
      // Don't show alert for empty history - it's normal for new users
      if (error.response?.status !== 500) {
        console.log('Conversion history error (non-critical):', error.response?.data || error.message);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      // Request JPEG format to avoid HEIC issues
      // Note: This may not work on all iOS versions, but helps when it does
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let fileName = asset.fileName || `image-${Date.now()}.jpg`;
      let fileUri = asset.uri;
      let mimeType = asset.type || 'image/jpeg';
      
      // Log asset details for debugging
      console.log('Selected image:', {
        fileName,
        type: asset.type,
        uri: asset.uri,
        width: asset.width,
        height: asset.height
      });
      
      // Don't block HEIC - let the server handle it
      // Determine MIME type from filename extension or asset type
      if (fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif')) {
        mimeType = 'image/heic';
      } else if (fileName.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (asset.type) {
        mimeType = asset.type;
      }
      
      // Set the file (works for both HEIC and regular images)
      setSelectedFile({
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });
      setPdfUri(null);
      setConversionMethod(null);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });
        setPdfUri(null);
        setConversionMethod(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const convertClientSide = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setConversionMethod('client');

    try {
      const pdfUri = await convertImageToPDFClient(selectedFile.uri, selectedFile.name);
      setPdfUri(pdfUri);
      Alert.alert('Success', 'File converted to PDF successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to convert file');
    } finally {
      setConverting(false);
    }
  };

  const convertServerSide = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setConversionMethod('server');

    try {
      const response = await pdfAPI.convertToPDF(
        selectedFile.uri,
        selectedFile.type,
        selectedFile.name
      );
      
      // Reload history
      await loadConversionHistory();
      
      Alert.alert('Success', 'File converted to PDF successfully!');
      setSelectedFile(null);
      setPdfUri(null);
    } catch (error: any) {
      console.error('Server-side conversion error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to convert file. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show alert with error message
      Alert.alert('Conversion Failed', errorMessage);
    } finally {
      setConverting(false);
    }
  };

  const sharePDF = async (uri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF');
    }
  };

  const viewPDF = async (conversion: FileConversion) => {
    // iOS WebView has limited PDF support, so we'll just open it with Share instead
    // This gives users the option to view in native PDF viewer, Files app, etc.
    Alert.alert(
      'View PDF',
      'Would you like to open this PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => sharePDFFromHistory(conversion)
        }
      ]
    );
  };

  const sharePDFFromHistory = async (conversion: FileConversion) => {
    try {
      const pdfUrl = pdfAPI.getPDFUrl(conversion.id);
      const filename = conversion.originalFile.replace(/\.[^/.]+$/, '') + '.pdf';
      
      console.log('Sharing PDF from:', pdfUrl);
      
      // Get auth token for the download request
      const token = await AsyncStorage.getItem('token');
      
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        `${FileSystem.documentDirectory}${filename}`,
        {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        }
      );

      console.log('Download result:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers
      });
      
      // Check if download was successful and file size is reasonable
      if (downloadResult.uri) {
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        console.log('Downloaded file info:', {
          exists: fileInfo.exists,
          size: fileInfo.size,
          uri: fileInfo.uri
        });
        
        if (!fileInfo.exists || !fileInfo.size || fileInfo.size < 100) {
          Alert.alert('Error', 'PDF download failed. File may be corrupt or you may not have access.');
          return;
        }
      } else {
        Alert.alert('Error', 'Failed to download PDF');
        return;
      }
      
      // Use Sharing to let user save/share the PDF
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Open PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('Open PDF error:', error);
      Alert.alert('Error', error.message || 'Failed to open PDF');
    }
  };

  const deleteConversion = async (id: string) => {
    try {
      await pdfAPI.deleteConversion(id);
      // Reload history
      await loadConversionHistory();
      Alert.alert('Success', 'Conversion deleted');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete conversion');
    }
  };

  const clearAllHistory = async () => {
    try {
      // Delete all conversions
      for (const conversion of conversions) {
        await pdfAPI.deleteConversion(conversion.id);
      }
      // Reload history
      await loadConversionHistory();
      Alert.alert('Success', 'All conversions cleared');
    } catch (error) {
      console.error('Clear history error:', error);
      Alert.alert('Error', 'Failed to clear history');
    }
  };

  const canConvertClient = selectedFile ? canConvertClientSide(selectedFile.type) : false;

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
            <Ionicons name="document-text" size={24} color={theme.neon.cyan} style={styles.titleIcon} />
            <Text style={styles.sectionTitle}>PDF CONVERTER</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        {!selectedFile ? (
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[styles.pickerButton, styles.pickerButtonPrimary]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="image" size={24} color={theme.text.primary} style={styles.buttonIcon} />
              <Text style={styles.pickerButtonText}>SELECT IMAGE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerButton, styles.pickerButtonSecondary]} 
              onPress={pickDocument}
              activeOpacity={0.8}
            >
              <Ionicons name="document" size={24} color={theme.text.primary} style={styles.buttonIcon} />
              <Text style={styles.pickerButtonText}>SELECT DOCUMENT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectedFileContainer}>
            <View style={styles.fileInfoHeader}>
              <Ionicons name="checkmark-circle" size={20} color={theme.neon.green} />
              <Text style={styles.selectedFileLabel}>FILE SELECTED</Text>
            </View>
            <View style={styles.fileNameContainer}>
              <Text style={styles.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
            </View>
            
            {selectedFile.type.startsWith('image/') && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
              </View>
            )}

            <View style={styles.convertButtons}>
              {canConvertClient && (
                <TouchableOpacity
                  style={[styles.convertButton, styles.clientButton]}
                  onPress={convertClientSide}
                  disabled={converting}
                  activeOpacity={0.8}
                >
                  {converting && conversionMethod === 'client' ? (
                    <ActivityIndicator color={theme.text.primary} />
                  ) : (
                    <>
                      <Ionicons name="phone-portrait" size={20} color={theme.text.primary} />
                      <Text style={styles.convertButtonText}>DEVICE</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.convertButton, styles.serverButton]}
                onPress={convertServerSide}
                disabled={converting}
                activeOpacity={0.8}
              >
                {converting && conversionMethod === 'server' ? (
                  <ActivityIndicator color={theme.text.primary} />
                ) : (
                  <>
                    <Ionicons name="cloud" size={20} color={theme.text.primary} />
                    <Text style={styles.convertButtonText}>SERVER</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {pdfUri && (
              <View style={styles.pdfActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => sharePDF(pdfUri)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share" size={18} color={theme.text.primary} />
                  <Text style={styles.actionButtonText}>SHARE PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedFile(null);
                setPdfUri(null);
                setConversionMethod(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={18} color={theme.status.error} />
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isAuthenticated && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="time" size={20} color={theme.neon.magenta} style={styles.titleIcon} />
              <Text style={styles.sectionTitle}>HISTORY</Text>
            </View>
            {conversions.length > 0 && (
              <TouchableOpacity
                style={styles.clearHistoryButton}
                onPress={() => {
                  Alert.alert(
                    'Clear History',
                    'Are you sure you want to delete all conversion history?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Clear All', 
                        style: 'destructive',
                        onPress: clearAllHistory 
                      }
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={16} color={theme.status.error} />
                <Text style={styles.clearHistoryButtonText}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingHistory ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.neon.cyan} />
              <Text style={styles.loadingText}>LOADING...</Text>
            </View>
          ) : conversions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={theme.text.muted} />
              <Text style={styles.emptyText}>NO CONVERSIONS FOUND</Text>
              <Text style={styles.emptySubtext}>Convert your first file to get started</Text>
            </View>
          ) : (
            conversions.map((conversion) => (
              <View key={conversion.id} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <View style={styles.historyFileHeader}>
                    <Ionicons name="document" size={16} color={theme.neon.cyan} />
                    <Text style={styles.historyFileName} numberOfLines={1}>
                      {conversion.originalFile}
                    </Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <View style={styles.historyMetaItem}>
                      <Ionicons name="calendar" size={12} color={theme.text.tertiary} />
                      <Text style={styles.historyDate}>
                        {new Date(conversion.convertedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.historyMetaItem}>
                      <Ionicons name="server" size={12} color={theme.text.tertiary} />
                      <Text style={styles.historyMethod}>
                        {conversion.method.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => sharePDFFromHistory(conversion)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="open" size={16} color={theme.text.primary} />
                    <Text style={styles.historyButtonText}>OPEN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteHistoryButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Conversion',
                        'Are you sure you want to delete this conversion?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => deleteConversion(conversion.id)
                          }
                        ]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash" size={18} color={theme.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

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
    ...theme.shadow.cyan,
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
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${theme.status.error}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
    gap: 6,
  },
  clearHistoryButtonText: {
    color: theme.status.error,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    gap: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  pickerButtonPrimary: {
    backgroundColor: `${theme.neon.cyan}15`,
    borderColor: theme.neon.cyan,
    ...theme.shadow.cyan,
  },
  pickerButtonSecondary: {
    backgroundColor: `${theme.neon.magenta}15`,
    borderColor: theme.neon.magenta,
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
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.neon.cyan,
    marginBottom: 16,
    ...theme.shadow.cyan,
  },
  previewImage: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
    backgroundColor: theme.bg.secondary,
  },
  convertButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  convertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  clientButton: {
    backgroundColor: `${theme.neon.green}20`,
    borderColor: theme.neon.green,
    ...theme.shadow.green,
  },
  serverButton: {
    backgroundColor: `${theme.neon.cyan}20`,
    borderColor: theme.neon.cyan,
    ...theme.shadow.cyan,
  },
  convertButtonText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pdfActions: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.neon.purple}20`,
    borderWidth: 2,
    borderColor: theme.neon.purple,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    ...theme.shadow.magenta,
  },
  actionButtonText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
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
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    color: theme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.text.secondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.text.tertiary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.bg.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border.dim,
  },
  historyItemContent: {
    flex: 1,
    marginRight: 12,
  },
  historyFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historyFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
    letterSpacing: 0.3,
  },
  historyMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  historyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 11,
    color: theme.text.tertiary,
    letterSpacing: 0.3,
  },
  historyMethod: {
    fontSize: 11,
    color: theme.text.tertiary,
    letterSpacing: 0.3,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.neon.cyan}20`,
    borderWidth: 1,
    borderColor: theme.neon.cyan,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  historyButtonText: {
    color: theme.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteHistoryButton: {
    padding: 10,
    backgroundColor: `${theme.status.error}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
  },
});
