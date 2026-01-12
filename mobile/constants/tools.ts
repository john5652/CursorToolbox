import { Ionicons } from '@expo/vector-icons';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  available: boolean;
}

export const TOOLS: Tool[] = [
  {
    id: 'pdf-converter',
    name: 'PDF Converter',
    description: 'Convert images and documents to PDF format',
    icon: 'document-text',
    route: '/(tabs)/pdf-convert',
    color: '#00ffff', // Cyan
    available: true,
  },
  {
    id: 'exif-viewer',
    name: 'EXIF Viewer',
    description: 'View metadata and EXIF data from files',
    icon: 'information-circle',
    route: '/(tabs)/exif-viewer',
    color: '#ff00ff', // Magenta
    available: true,
  },
  {
    id: 'nmap-scanner',
    name: 'Nmap Scanner',
    description: 'Network scanning tool using nmap',
    icon: 'scan',
    route: '/(tabs)/nmap-scanner',
    color: '#00ff00', // Green
    available: true,
  },
  {
    id: 'virustotal-scanner',
    name: 'VirusTotal Scanner',
    description: 'Analyze files, URLs, and hashes for malware',
    icon: 'shield-checkmark',
    route: '/(tabs)/virustotal-scanner',
    color: '#00ff00', // Green
    available: true,
  },
  // Add more tools here as they're built
];
