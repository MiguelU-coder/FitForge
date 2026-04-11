// app/(tabs)/profile.tsx
// Port of profile_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/profile/presentation/screens/profile_screen.dart

import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows, Gradients } from "../../src/theme/colors";
import { useAuthStore } from "../../src/stores/useAuthStore";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface SettingsRowProps {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isLast,
}: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        pressed && styles.settingsRowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIconWrap}>
          <Ionicons name={icon} size={16} color={Colors.primary} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
        {onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textTertiary}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
  const { history } = useWorkoutStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initials = (user?.displayName ?? "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: logout },
      ],
    );
  };

  const showSelectionDialog = (
    title: string,
    options: string[],
    currentValue: string,
    onSelect: (val: string) => void,
  ) => {
    Alert.alert(
      `Select ${title}`,
      "",
      options.map((option) => ({
        text: option.toUpperCase(),
        onPress: () => onSelect(option),
      })),
      { cancelable: true },
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>PERFIL</Text>
        <Pressable onPress={handleLogout} style={styles.logoutIconBtn}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* ── Avatar + name ── */}
      <LinearGradient
        colors={["#0A1F1480", Colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.profileHero}
      >
        <View style={styles.avatarRing}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.profileName}>{user?.displayName ?? "Athlete"}</Text>
        <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
        <View style={styles.memberBadge}>
          <View style={styles.memberDot} />
          <Text style={styles.memberBadgeText}>ACTIVE MEMBER</Text>
        </View>
      </LinearGradient>

      {/* ── Stats Card ── */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {history?.length?.toString() ?? "0"}
            </Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0m</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>
      </View>

      {/* ── Preferences Section ── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>PREFERENCES</Text>
      </View>

      <View style={styles.settingsCard}>
        <SettingsRow
          icon="scale-outline"
          label="Weight Unit"
          value={user?.weightUnit?.toUpperCase() ?? "KG"}
          onPress={() =>
            showSelectionDialog(
              "Weight Unit",
              ["kg", "lbs"],
              user?.weightUnit ?? "kg",
              (val) => updateProfile({ weightUnit: val }),
            )
          }
        />
        <SettingsRow
          icon="resize-outline"
          label="Height Unit"
          value={user?.heightUnit?.toUpperCase() ?? "CM"}
          onPress={() =>
            showSelectionDialog(
              "Height Unit",
              ["cm", "in"],
              user?.heightUnit ?? "cm",
              (val) => updateProfile({ heightUnit: val }),
            )
          }
        />
        <SettingsRow
          icon="timer-outline"
          label="Default Rest"
          value={`${user?.defaultRestSeconds ?? 90}s`}
          onPress={() =>
            showSelectionDialog(
              "Default Rest",
              ["30", "60", "90", "120", "180", "240"],
              `${user?.defaultRestSeconds ?? 90}`,
              (val) => updateProfile({ defaultRestSeconds: parseInt(val, 10) }),
            )
          }
        />
      </View>

      {/* ── Account Section ── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>ACCOUNT</Text>
      </View>

      <View style={styles.settingsCard}>
        <SettingsRow
          icon="person-outline"
          label="Edit Profile"
          onPress={() => router.push("/profile/edit")}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => {}}
          isLast
        />
      </View>

      {/* ── App Section ── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>APP</Text>
      </View>

      <View style={styles.settingsCard}>
        <SettingsRow
          icon="information-circle-outline"
          label="Version"
          value="1.0.0"
          isLast
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },

  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "BebasNeue",
    fontSize: 28,
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Profile Hero
  profileHero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}66`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Shadows.primaryGlow,
  },
  avatarWrap: {
    // inner spacing handled by avatarRing
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontFamily: "BebasNeue",
    fontSize: 34,
    letterSpacing: 1,
    color: "#FFF",
  },
  profileName: {
    fontFamily: "BebasNeue",
    fontSize: 28,
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  memberBadgeText: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.primary,
  },

  // Stats Card
  statsCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontFamily: "BebasNeue",
    fontSize: 28,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 36,
    backgroundColor: Colors.border,
  },

  // Section labels
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionLabelText: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
  },

  // Settings cards
  settingsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingsRowPressed: {
    backgroundColor: `${Colors.primary}0D`,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsValue: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    fontWeight: "300",
    color: Colors.textSecondary,
  },
});
