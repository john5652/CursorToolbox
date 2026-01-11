import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TOOLS } from '../../constants/tools';
import { theme } from '../../constants/theme';
import HackerBackground from '../../components/HackerBackground';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function HomeScreen() {
  const { user } = useAuth();

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.available) {
      router.push(tool.route as any);
    }
  };

  return (
    <View style={styles.wrapper}>
      <HackerBackground opacity={0.12} speed={0.8} />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>SYSTEM ONLINE</Text>
          <View style={styles.statusIndicator} />
        </View>
        <Text style={styles.title}>TOOLBOX</Text>
        <Text style={styles.subtitle}>
          {user ? `USER: ${user.username.toUpperCase()}` : 'GUEST MODE'}
        </Text>
        <View style={styles.divider} />
      </View>

      {/* Tools Grid */}
      <View style={styles.toolsContainer}>
        <Text style={styles.sectionTitle}>AVAILABLE TOOLS</Text>
        <View style={styles.toolsGrid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolCard,
                !tool.available && styles.toolCardDisabled,
                { borderColor: tool.color },
              ]}
              onPress={() => handleToolPress(tool)}
              disabled={!tool.available}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                <Ionicons 
                  name={tool.icon} 
                  size={32} 
                  color={tool.available ? tool.color : theme.text.muted} 
                />
              </View>
              <Text style={[styles.toolName, !tool.available && styles.toolNameDisabled]}>
                {tool.name}
              </Text>
              <Text style={[styles.toolDescription, !tool.available && styles.toolDescriptionDisabled]}>
                {tool.description}
              </Text>
              {!tool.available && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>COMING SOON</Text>
                </View>
              )}
              <View style={[styles.cardGlow, { shadowColor: tool.color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {TOOLS.filter(t => t.available).length} / {TOOLS.length} TOOLS ACTIVE
        </Text>
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
    paddingTop: 20,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.neon.green,
    letterSpacing: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.neon.green,
    ...theme.shadow.green,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.text.primary,
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: theme.neon.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 2,
    backgroundColor: theme.neon.cyan,
    ...theme.shadow.cyan,
  },
  toolsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.neon.magenta,
    letterSpacing: 2,
    marginBottom: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  toolCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  toolCardDisabled: {
    opacity: 0.5,
    borderColor: theme.border.dim,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border.dim,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  toolNameDisabled: {
    color: theme.text.muted,
  },
  toolDescription: {
    fontSize: 12,
    color: theme.text.secondary,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  toolDescriptionDisabled: {
    color: theme.text.muted,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.bg.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.neon.yellow,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.neon.yellow,
    letterSpacing: 1,
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 12,
    opacity: 0.3,
    ...theme.shadow.cyan,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.tertiary,
    letterSpacing: 1,
  },
});
