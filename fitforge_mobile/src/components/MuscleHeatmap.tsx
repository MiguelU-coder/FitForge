import { View, Text, StyleSheet } from "react-native";
import Body from "react-native-body-highlighter";
import { Colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyTotal } from "../types/progress";

interface MuscleHeatmapProps {
  volumeData: WeeklyTotal[]; // Represents current week data filtered by the parent
}

// Map backend muscle names to react-native-body-highlighter Slugs
const mapMuscle = (backendName: string): any => {
  switch (backendName.toUpperCase()) {
    case "CHEST":
      return "chest";
    case "BACK":
      return "upper-back";
    case "SHOULDERS":
      return "deltoids";
    case "BICEPS":
      return "biceps";
    case "TRICEPS":
      return "triceps";
    case "QUADS":
      return "quadriceps";
    case "HAMSTRINGS":
      return "hamstring";
    case "GLUTES":
      return "gluteal";
    case "CALVES":
      return "calves";
    case "ABS":
      return "abs";
    default:
      return null;
  }
};

const getColorForVolume = (totalSets: number): string => {
  if (totalSets > 20) return "#EF4444"; // Red - Overload
  if (totalSets >= 10 && totalSets <= 20) return "#10B981"; // Green - Optimal
  return "#F59E0B"; // Orange - Under MEV
};

export default function MuscleHeatmap({ volumeData }: MuscleHeatmapProps) {
  // Aggregate data specifically by muscle
  const muscleSets: Record<string, number> = {};

  volumeData?.forEach((vol) => {
    if (vol.muscleGroup) {
      const slug = mapMuscle(vol.muscleGroup);
      if (slug) {
        muscleSets[slug] = (muscleSets[slug] || 0) + vol.totalSets;
      }
    }
  });

  const bodyData = Object.entries(muscleSets).map(([slug, sets]) => ({
    slug: slug as any,
    color: getColorForVolume(sets),
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="body-outline" size={16} color={Colors.primary} />
        </View>
        <Text style={styles.title}>MAPA DE CALOR MUSCULAR</Text>
      </View>

      <View style={styles.bodyWrap}>
        <View style={styles.bodyCol}>
          <Body
            data={bodyData}
            side="front"
            scale={0.7}
            defaultFill="#1E1E1E"
            defaultStroke="#333333"
            defaultStrokeWidth={1}
            gender="male"
          />
        </View>
        <View style={styles.bodyCol}>
          <Body
            data={bodyData}
            side="back"
            scale={0.7}
            defaultFill="#1E1E1E"
            defaultStroke="#333333"
            defaultStrokeWidth={1}
            gender="male"
          />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <Text style={styles.legendText}>Óptimo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.legendText}>Sobrecarga</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={styles.legendText}>Bajo MEV</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    marginRight: 10,
  },
  title: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    letterSpacing: 2,
    color: "#CCCCCC",
  },
  bodyWrap: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 380, // Adjust height based on scale
    overflow: "hidden",
  },
  bodyCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 11,
    color: "#888888",
  },
});
