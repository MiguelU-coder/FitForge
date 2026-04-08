import { Colors } from '../theme/colors';

export function getMuscleColor(muscle: string): string {
  if (!muscle) return Colors.primary;
  
  const normalized = muscle.toUpperCase().trim();
  
  switch (normalized) {
    case 'CHEST':
    case 'ALL':
      return Colors.primary; // #18B97A
    case 'BACK':
      return Colors.info; // #0EA5E9
    case 'SHOULDERS':
      return Colors.warning; // #F59E0B
    case 'BICEPS':
      return Colors.secondary; // #6D28D9
    case 'TRICEPS':
      return '#F43F5E'; // Rose
    case 'QUADS':
      return '#2DD4BF'; // Teal
    case 'HAMSTRINGS':
      return '#EF4444'; // Red
    case 'GLUTES':
      return '#D946EF'; // Fuchsia
    case 'CALVES':
      return '#84CC16'; // Lime
    case 'ABS':
      return '#38BDF8'; // Sky
    default:
      return Colors.primary;
  }
}
