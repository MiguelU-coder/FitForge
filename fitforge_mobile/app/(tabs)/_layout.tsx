// app/(tabs)/_layout.tsx
// Carbon Forge — Premium Athletic Nav

import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { Colors } from "../../src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const TABS = [
  { name: "index", label: "Home", icon: "home", iconOff: "home-outline" },
  {
    name: "exercises",
    label: "Exercises",
    icon: "barbell",
    iconOff: "barbell-outline",
    rotate: true,
  },
  {
    name: "templates",
    label: "Templates",
    icon: "grid",
    iconOff: "grid-outline",
  },
  {
    name: "progress",
    label: "Progress",
    icon: "trending-up",
    iconOff: "trending-up-outline",
  },
  {
    name: "profile",
    label: "Profile",
    icon: "person",
    iconOff: "person-outline",
  },
] as const;

// ─── Tab Icon ────────────────────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const tab = TABS.find((t) => t.label === label)!;
  const iconName = (focused ? tab.icon : tab.iconOff) as any;
  const hasRotate = "rotate" in tab && tab.rotate;

  return (
    <View style={styles.tabItemOuter}>
      {/* Línea superior — siempre reserva espacio */}
      <View style={styles.topLineWrapper}>
        {focused && (
          <LinearGradient
            colors={["transparent", Colors.primary, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topLineGradient}
          />
        )}
      </View>

      {/* Pill centrado */}
      <View
        style={[
          styles.tabItemContainer,
          focused && styles.tabItemContainerActive,
        ]}
      >
        <View style={focused ? styles.iconHalo : undefined}>
          <Ionicons
            name={iconName}
            size={20}
            color={focused ? Colors.primary : "#505A60"}
            style={
              hasRotate ? { transform: [{ rotate: "-45deg" }] } : undefined
            }
          />
        </View>
        <Text
          style={[styles.tabLabel, focused && styles.tabLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

// ─── Custom Button (removes Android ripple / iOS highlight) ──────────────────

function TabBarButton(props: any) {
  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={[
        props.style,
        {
          backgroundColor: "transparent",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
        },
      ]}
      android_ripple={null}
      unstable_pressDelay={0}
    >
      {props.children}
    </Pressable>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarBottom =
    Platform.OS === "ios" ? Math.max(insets.bottom + 6, 18) : 14;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [styles.tabBar, { bottom: tabBarBottom }],
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={70}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 36, overflow: "hidden" },
            ]}
          >
            {/* Dark emerald depth gradient */}
            <LinearGradient
              colors={["rgba(18, 28, 22, 0.50)", "rgba(6,  10,  8, 0.88)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Subtle top-edge highlight */}
            <View style={styles.innerTopBorder} />
          </BlurView>
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarButton: (props) => <TabBarButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <TabIcon label={tab.label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating pill container
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 55,
    borderRadius: 36,
    backgroundColor: "rgba(8, 12, 10, 0.78)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(24, 185, 122, 0.12)",
    paddingBottom: 0,
    paddingTop: 0,
    justifyContent: "center",
    // iOS shadow — deep green-black
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    // Android
    elevation: 16,
  },

  // Inner top-edge highlight line (gives the "glass edge" feel)
  innerTopBorder: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 1,
  },

  tabBarItem: {
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // Outer wrapper — full cell
  tabItemOuter: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  topLineWrapper: {
    width: 32,
    height: 3,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  topLineGradient: {
    width: 32,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  // Animated green line at very top of pill
  topGlowLine: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 32,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Icon + label inner pill
  tabItemContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 52,
    gap: 3,
  },
  tabItemContainerActive: {
    backgroundColor: "rgba(24, 185, 122, 0.11)",
    borderWidth: 0.5,
    borderColor: "rgba(24, 185, 122, 0.30)",
  },

  // Halo glow behind active icon
  iconHalo: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 10,
  },
  iconPlain: {},

  // Labels
  tabLabel: {
    fontSize: 9,
    fontFamily: "DMSans-SemiBold",
    color: "#424C52",
    letterSpacing: 0.25,
    textTransform: "uppercase",
  },
  tabLabelActive: {
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});
