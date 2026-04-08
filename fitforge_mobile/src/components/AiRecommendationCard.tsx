import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface AiRecommendationCardProps {
  isLoading?: boolean;
  message?: string;
  action?: string;
}

export default function AiRecommendationCard({ isLoading, message, action }: AiRecommendationCardProps) {
  if (!isLoading && !message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={16} color={Colors.secondaryBright} />
      </View>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>AI Coach is analyzing your set...</Text>
            <ActivityIndicator size="small" color={Colors.secondaryBright} />
          </View>
        ) : (
          <Text style={styles.messageText}>
            {action && <Text style={styles.actionText}>{action}: </Text>}
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#1E1A29', // Dark violet-tinted carbon
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D2D5E', // Subtle violet border
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', // Violet with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 28,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.secondaryBright,
    opacity: 0.8,
  },
  messageText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: '#E2D5F8',
    lineHeight: 18,
  },
  actionText: {
    fontFamily: 'DMSans-Bold',
    color: Colors.secondaryBright,
  },
});
