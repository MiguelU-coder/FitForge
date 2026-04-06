// app/(tabs)/_layout.tsx
// Port of main_shell.dart — Floating navigation bar with blur effect

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
  
  if (name === 'Home') iconName = focused ? 'home' : 'home-outline';
  if (name === 'Exercises') iconName = focused ? 'barbell' : 'barbell-outline';
  if (name === 'Templates') iconName = focused ? 'grid' : 'grid-outline';
  if (name === 'Progress') iconName = focused ? 'trending-up' : 'trending-up-outline';
  if (name === 'Profile') iconName = focused ? 'person' : 'person-outline';

  return (
    <View style={styles.tabItemContainer}>
      <View style={[styles.tabItem, focused && styles.tabItemActive]}>
        <Ionicons
          name={iconName}
          size={22}
          color={focused ? Colors.primary : Colors.textSecondary}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          { bottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Exercises" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Templates" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    // Android shadow
    elevation: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    paddingBottom: 0,
    paddingTop: 0,
    overflow: 'hidden',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    minWidth: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: 10,
    marginBottom: 2,
  },
  tabItemActive: {
    backgroundColor: `${Colors.primary}26`,
  },
  tabLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontFamily: 'DMSans-Bold',
    color: Colors.primary,
  },
});
