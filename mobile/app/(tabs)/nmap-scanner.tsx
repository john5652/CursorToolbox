import { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { nmapAPI, NmapScanResponse } from '../../services/nmapAPI';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

export default function NmapScannerScreen() {
  const { isAuthenticated } = useAuth();
  const [host, setHost] = useState('');
  const [flags, setFlags] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<NmapScanResponse | null>(null);
  const [scanDuration, setScanDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for showing scan duration
  useEffect(() => {
    if (scanning) {
      setScanDuration(0);
      intervalRef.current = setInterval(() => {
        setScanDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanning]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleScan = async () => {
    if (!host.trim()) {
      Alert.alert('Error', 'Please enter a host to scan');
      return;
    }

    setScanning(true);
    setScanResult(null);
    setScanDuration(0);

    try {
      const result = await nmapAPI.scanHost(host.trim(), flags.trim() || undefined);
      setScanResult(result);
    } catch (error: any) {
      console.error('Nmap scan error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to scan host. Please try again.';
      
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
      
      Alert.alert('Scan Failed', errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const clearResults = () => {
    setHost('');
    setFlags('');
    setScanResult(null);
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
            <Ionicons name="scan" size={24} color={theme.neon.cyan} style={styles.titleIcon} />
            <Text style={styles.sectionTitle}>NMAP SCANNER</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="server" size={16} color={theme.neon.cyan} />
              <Text style={styles.inputLabel}>HOST</Text>
            </View>
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder="e.g., 192.168.1.1, scanme.nmap.org, 10.0.0.0/24"
              placeholderTextColor={theme.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!scanning}
            />
            <Text style={styles.inputHint}>
              Enter IP address, hostname, or CIDR range
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="options" size={16} color={theme.neon.magenta} />
              <Text style={styles.inputLabel}>FLAGS (OPTIONAL)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={flags}
              onChangeText={setFlags}
              placeholder="e.g., -sS -p 80,443 or leave empty for default scan"
              placeholderTextColor={theme.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!scanning}
            />
            <Text style={styles.inputHint}>
              Leave empty to run default nmap scan. Verbose mode (-v) is automatically enabled.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={scanning || !host.trim()}
          activeOpacity={0.8}
        >
          {scanning ? (
            <>
              <ActivityIndicator color={theme.text.primary} size="small" />
              <View style={styles.scanningInfo}>
                <Text style={styles.scanButtonText}>SCANNING...</Text>
                <Text style={styles.scanDurationText}>
                  {formatDuration(scanDuration)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="play" size={20} color={theme.text.primary} />
              <Text style={styles.scanButtonText}>START SCAN</Text>
            </>
          )}
        </TouchableOpacity>

        {scanning && (
          <View style={styles.scanStatusContainer}>
            <View style={styles.scanStatusRow}>
              <Ionicons name="information-circle" size={14} color={theme.neon.cyan} />
              <Text style={styles.scanStatusText}>
                Scan in progress... This may take several minutes for large networks.
              </Text>
            </View>
            <View style={styles.scanStatusRow}>
              <Ionicons name="eye" size={14} color={theme.neon.magenta} />
              <Text style={styles.scanStatusText}>
                Verbose mode enabled (-v flag) - showing detailed progress
              </Text>
            </View>
          </View>
        )}

        {scanResult && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={20} color={theme.neon.green} />
              <Text style={styles.resultsTitle}>SCAN COMPLETE</Text>
            </View>

            <View style={styles.resultInfoSection}>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Host:</Text>
                <Text style={styles.resultInfoValue}>{scanResult.host}</Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Flags:</Text>
                <Text style={styles.resultInfoValue}>
                  {scanResult.flags || 'none (default)'}
                </Text>
              </View>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultInfoLabel}>Execution Time:</Text>
                <Text style={styles.resultInfoValue}>
                  {scanResult.executionTime}ms
                </Text>
              </View>
            </View>

            <View style={styles.outputContainer}>
              <View style={styles.outputHeader}>
                <Ionicons name="terminal" size={16} color={theme.neon.cyan} />
                <Text style={styles.outputTitle}>SCAN OUTPUT</Text>
              </View>
              <ScrollView 
                style={styles.outputScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.outputText}>
                  {scanResult.output || 'No output'}
                </Text>
              </ScrollView>
            </View>

            {scanResult.stderr && (
              <View style={styles.errorContainer}>
                <View style={styles.errorHeader}>
                  <Ionicons name="warning" size={16} color={theme.status.error} />
                  <Text style={styles.errorTitle}>WARNINGS/ERRORS</Text>
                </View>
                <ScrollView 
                  style={styles.outputScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.errorText}>
                    {scanResult.stderr}
                  </Text>
                </ScrollView>
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
    gap: 20,
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.neon.cyan,
    backgroundColor: `${theme.neon.cyan}20`,
    gap: 8,
    ...theme.shadow.cyan,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scanningInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  scanDurationText: {
    color: theme.neon.cyan,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  scanStatusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${theme.neon.cyan}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.neon.cyan,
    gap: 8,
  },
  scanStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanStatusText: {
    flex: 1,
    fontSize: 11,
    color: theme.text.secondary,
    letterSpacing: 0.3,
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
    color: theme.neon.green,
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
  },
  outputContainer: {
    backgroundColor: theme.bg.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border.dim,
    overflow: 'hidden',
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.dim,
    backgroundColor: theme.bg.primary,
  },
  outputTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.neon.cyan,
    letterSpacing: 1,
  },
  outputScrollView: {
    maxHeight: 300,
  },
  outputText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: theme.text.primary,
    padding: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  errorContainer: {
    backgroundColor: theme.bg.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.status.error,
    overflow: 'hidden',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.status.error,
    backgroundColor: `${theme.status.error}10`,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.status.error,
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: theme.status.error,
    padding: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
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
