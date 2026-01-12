import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { virustotalAPI, VirusTotalAnalysisResponse } from '../../services/virustotalAPI';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

export default function VirusTotalScannerScreen() {
  const { isAuthenticated } = useAuth();
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VirusTotalAnalysisResponse | null>(null);
  const [detectedType, setDetectedType] = useState<'hash' | 'url' | 'file' | null>(null);

  // Detect input type
  const detectInputType = (text: string): 'hash' | 'url' | 'unknown' => {
    const trimmed = text.trim();
    
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return 'url';
    }
    
    const hashPattern = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
    if (hashPattern.test(trimmed)) {
      return 'hash';
    }
    
    return 'unknown';
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });
        setInput(asset.name);
        setDetectedType('file');
        setAnalysisResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() && !selectedFile) {
      Alert.alert('Error', 'Please enter a hash, URL, or select a file');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      let result: VirusTotalAnalysisResponse;

      if (selectedFile) {
        // Analyze file
        result = await virustotalAPI.analyzeFile(
          selectedFile.uri,
          selectedFile.type,
          selectedFile.name
        );
        setDetectedType('file');
      } else {
        const inputType = detectInputType(input.trim());
        
        if (inputType === 'unknown') {
          Alert.alert('Error', 'Invalid input format. Please enter a hash (MD5/SHA-1/SHA-256), URL (http:// or https://), or select a file');
          setAnalyzing(false);
          return;
        }

        setDetectedType(inputType);
        
        // Use unified analyze endpoint
        result = await virustotalAPI.analyze(input.trim());
      }

      setAnalysisResult(result);
    } catch (error: any) {
      console.error('VirusTotal analysis error:', error);
      
      let errorMessage = 'Failed to analyze. Please try again.';
      
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
      
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearResults = () => {
    setInput('');
    setSelectedFile(null);
    setAnalysisResult(null);
    setDetectedType(null);
  };

  const getTypeLabel = (type: string | null): string => {
    if (!type) return '';
    switch (type) {
      case 'hash': return 'HASH';
      case 'url': return 'URL';
      case 'file': return 'FILE';
      default: return '';
    }
  };

  const getTypeColor = (type: string | null): string => {
    if (!type) return theme.neon.cyan;
    switch (type) {
      case 'hash': return theme.neon.magenta;
      case 'url': return theme.neon.green;
      case 'file': return theme.neon.cyan;
      default: return theme.neon.cyan;
    }
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
            <Ionicons name="shield-checkmark" size={24} color={theme.neon.green} style={styles.titleIcon} />
            <Text style={styles.sectionTitle}>VIRUSTOTAL SCANNER</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="search" size={16} color={theme.neon.cyan} />
              <Text style={styles.inputLabel}>INPUT</Text>
            </View>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (selectedFile) {
                  setSelectedFile(null);
                  setDetectedType(null);
                } else {
                  const type = detectInputType(text);
                  setDetectedType(type !== 'unknown' ? type : null);
                }
              }}
              placeholder="Enter hash (MD5/SHA-1/SHA-256), URL, or select file below"
              placeholderTextColor={theme.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!analyzing}
            />
            {detectedType && (
              <View style={[styles.typeBadge, { borderColor: getTypeColor(detectedType) }]}>
                <Text style={[styles.typeBadgeText, { color: getTypeColor(detectedType) }]}>
                  {getTypeLabel(detectedType)}
                </Text>
              </View>
            )}
            <Text style={styles.inputHint}>
              Auto-detects: Hash (32/40/64 chars), URL (http:// or https://), or File upload
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fileButton}
            onPress={pickFile}
            disabled={analyzing}
            activeOpacity={0.8}
          >
            <Ionicons name="document-attach" size={18} color={theme.neon.magenta} />
            <Text style={styles.fileButtonText}>
              {selectedFile ? `File: ${selectedFile.name}` : 'SELECT FILE'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={analyzing || (!input.trim() && !selectedFile)}
          activeOpacity={0.8}
        >
          {analyzing ? (
            <>
              <ActivityIndicator color={theme.text.primary} size="small" />
              <Text style={styles.analyzeButtonText}>ANALYZING...</Text>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={theme.text.primary} />
              <Text style={styles.analyzeButtonText}>ANALYZE</Text>
            </>
          )}
        </TouchableOpacity>

        {analyzing && (
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Ionicons name="information-circle" size={14} color={theme.neon.cyan} />
              <Text style={styles.statusText}>
                Analysis in progress... This may take a few moments.
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons name="time" size={14} color={theme.neon.magenta} />
              <Text style={styles.statusText}>
                Free tier: 4 requests per minute limit
              </Text>
            </View>
          </View>
        )}

        {analysisResult && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons 
                name={analysisResult.results.positives > 0 ? "warning" : "checkmark-circle"} 
                size={20} 
                color={analysisResult.results.positives > 0 ? theme.status.error : theme.neon.green} 
              />
              <Text style={styles.resultsTitle}>
                {analysisResult.results.positives > 0 ? 'THREATS DETECTED' : 'CLEAN'}
              </Text>
            </View>

            <View style={styles.resultInfoSection}>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Type:</Text>
                <Text style={[styles.resultInfoValue, { color: getTypeColor(analysisResult.type) }]}>
                  {getTypeLabel(analysisResult.type)}
                </Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Input:</Text>
                <Text style={styles.resultInfoValue} numberOfLines={1}>
                  {analysisResult.input}
                </Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Detection Ratio:</Text>
                <Text style={[
                  styles.resultInfoValue,
                  { color: analysisResult.results.positives > 0 ? theme.status.error : theme.neon.green }
                ]}>
                  {analysisResult.results.positives}/{analysisResult.results.totalEngines}
                </Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Positives:</Text>
                <Text style={[
                  styles.resultInfoValue,
                  { color: analysisResult.results.positives > 0 ? theme.status.error : theme.text.primary }
                ]}>
                  {analysisResult.results.positives}
                </Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Total Engines:</Text>
                <Text style={styles.resultInfoValue}>
                  {analysisResult.results.totalEngines}
                </Text>
              </View>
              {analysisResult.results.scanDate && (
                <View style={styles.resultInfoRow}>
                  <Text style={styles.resultInfoLabel}>Scan Date:</Text>
                  <Text style={styles.resultInfoValue}>
                    {new Date(analysisResult.results.scanDate * 1000).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {analysisResult.results.positives > 0 && (
              <View style={styles.threatContainer}>
                <View style={styles.threatHeader}>
                  <Ionicons name="warning" size={16} color={theme.status.error} />
                  <Text style={styles.threatTitle}>THREAT DETECTIONS</Text>
                </View>
                <ScrollView 
                  style={styles.threatScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {Object.entries(analysisResult.results.engines)
                    .filter(([_, engine]) => engine.category === 'malicious' || engine.category === 'suspicious')
                    .map(([engineName, engine]) => (
                      <View key={engineName} style={styles.threatItem}>
                        <Text style={styles.threatEngine}>{engineName}</Text>
                        <Text style={styles.threatResult}>{engine.result || 'Malicious'}</Text>
                      </View>
                    ))}
                </ScrollView>
              </View>
            )}

            {analysisResult.results.sha256 && (
              <View style={styles.hashContainer}>
                <View style={styles.hashHeader}>
                  <Ionicons name="key" size={16} color={theme.neon.cyan} />
                  <Text style={styles.hashTitle}>FILE HASHES</Text>
                </View>
                {analysisResult.results.sha256 && (
                  <View style={styles.hashRow}>
                    <Text style={styles.hashLabel}>SHA-256:</Text>
                    <Text style={styles.hashValue} numberOfLines={1}>
                      {analysisResult.results.sha256}
                    </Text>
                  </View>
                )}
                {analysisResult.results.sha1 && (
                  <View style={styles.hashRow}>
                    <Text style={styles.hashLabel}>SHA-1:</Text>
                    <Text style={styles.hashValue} numberOfLines={1}>
                      {analysisResult.results.sha1}
                    </Text>
                  </View>
                )}
                {analysisResult.results.md5 && (
                  <View style={styles.hashRow}>
                    <Text style={styles.hashLabel}>MD5:</Text>
                    <Text style={styles.hashValue} numberOfLines={1}>
                      {analysisResult.results.md5}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearResults}
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
  inputContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text.primary,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.bg.secondary,
    borderWidth: 1,
    borderColor: theme.border.dim,
    borderRadius: 8,
    padding: 12,
    color: theme.text.primary,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  inputHint: {
    fontSize: 11,
    color: theme.text.tertiary,
    letterSpacing: 0.3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.neon.magenta,
    backgroundColor: `${theme.neon.magenta}20`,
    gap: 8,
  },
  fileButtonText: {
    color: theme.neon.magenta,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.neon.green,
    backgroundColor: `${theme.neon.green}20`,
    gap: 8,
    ...theme.shadow.green,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${theme.neon.cyan}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.neon.cyan,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsContainer: {
    marginTop: 20,
    gap: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    color: theme.text.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultInfoSection: {
    backgroundColor: theme.bg.secondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    gap: 8,
  },
  resultInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
    letterSpacing: 0.3,
  },
  resultInfoValue: {
    fontSize: 12,
    color: theme.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'right',
  },
  threatContainer: {
    backgroundColor: theme.bg.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
    overflow: 'hidden',
  },
  threatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.status.error,
    backgroundColor: `${theme.status.error}10`,
  },
  threatTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.status.error,
    letterSpacing: 1,
  },
  threatScrollView: {
    maxHeight: 200,
  },
  threatItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  threatEngine: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  threatResult: {
    fontSize: 10,
    color: theme.status.error,
    fontFamily: 'monospace',
  },
  hashContainer: {
    backgroundColor: theme.bg.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    overflow: 'hidden',
  },
  hashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
    backgroundColor: theme.bg.primary,
  },
  hashTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.neon.cyan,
    letterSpacing: 1,
  },
  hashRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
  },
  hashLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text.secondary,
    width: 70,
  },
  hashValue: {
    fontSize: 10,
    color: theme.text.primary,
    fontFamily: 'monospace',
    flex: 1,
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
