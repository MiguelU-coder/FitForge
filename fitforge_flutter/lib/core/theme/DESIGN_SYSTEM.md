# FitForge Design System

Tema oscuro optimizado para fitness tracker (inspirado en Strong, Hevy, Apple Fitness).

## Estructura

| Archivo | Uso |
|--------|-----|
| `app_colors.dart` | Paleta única: fondos, primary, semánticos, texto. **Siempre usar desde aquí.** |
| `app_theme.dart` | `ThemeData` (AppBar, Card, ElevatedButton, Input, BottomNav, TextTheme con Inter). |
| `app_spacing.dart` | Constantes de espaciado (`AppSpacing`) y radios (`AppRadius`). |

## Colores

- **Fondos:** `AppColors.background`, `AppColors.card`, `AppColors.elevated`
- **Primary:** `AppColors.primary` (verde), `AppColors.primaryBright` (highlights/progreso)
- **Feedback:** `AppColors.success`, `AppColors.error`, `AppColors.warning`
- **Texto:** `AppColors.textPrimary`, `AppColors.textSecondary`, `AppColors.textTertiary`
- **Fitness:** `AppColors.pr` (records), `AppColors.failure`, `AppColors.dropSet`

## Tipografía (Inter)

Usar `Theme.of(context).textTheme`:

- **headlineLarge / headlineMedium** — Títulos de pantalla y secciones
- **bodyLarge / bodyMedium** — Cuerpo y descripciones
- **labelLarge / labelMedium / labelSmall** — Etiquetas, chips, metadata

## Componentes base

- **WorkoutCard** (`core/widgets/workout_card.dart`) — Listados de entrenamientos
- **ExerciseCard** (`core/widgets/exercise_card.dart`) — Ejercicios en lista/sesión
- **PrimaryActionButton** (`core/widgets/primary_action_button.dart`) — CTA (Start Workout)
- **StatsDisplay** + **StatsRow** (`core/widgets/stats_display.dart`) — Peso, reps, sets, PRs

## Espaciado y Radios

Usar `AppSpacing` y `AppRadius` para consistencia:

```dart
// Espaciado
padding: EdgeInsets.all(AppSpacing.lg)   // 16px
SizedBox(height: AppSpacing.xl)          // 24px

// Radios
borderRadius: BorderRadius.circular(AppRadius.md)  // 12px
Container(decoration: BoxDecoration(borderRadius: AppRadius.radiusLg))
```

Valores disponibles:
- **AppSpacing**: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32)
- **AppRadius**: xs(4), sm(8), md(12), lg(16), xl(20), xxl(24), full(999)

## Buenas prácticas para escalar

1. **Un solo origen de color**  
   No definir `Color(0xFF...)` en pantallas. Usar siempre `AppColors.*` o `Theme.of(context).colorScheme`.

2. **Texto desde el tema**  
   Preferir `theme.textTheme.titleLarge` en lugar de `TextStyle(fontSize: 17, ...)` para mantener Inter y jerarquía.

3. **Espaciado y radios**  
   Considerar `AppSpacing` y `AppRadius` si el equipo crece (ej: `AppRadius.card = 16`). Por ahora los componentes usan 12–16px de radio.

4. **Nuevos componentes**  
   Reutilizar `AppColors`, `AppTheme.glassCard` / `neonCard` / `gradientCard` y `theme.textTheme` en widgets nuevos para mantener coherencia.

5. **Variantes de botón**  
   Primaria: `ElevatedButton` / `FilledButton`. Secundaria: `OutlinedButton`. Terciaria: `TextButton`. No crear estilos ad hoc.

6. **Pantallas objetivo**  
   El tema está pensado para: workout tracker, exercise list, set logging, progress stats y personal records. Al añadir pantallas nuevas, reutilizar WorkoutCard, ExerciseCard y StatsDisplay donde aplique.

7. **Accesibilidad**  
   Contraste texto/fondo cumple criterios básicos (blanco sobre negro, verde sobre negro). Revisar contraste en chips y labels pequeños si se cambian tonos.

8. **Tema claro (futuro)**  
   Si se añade tema claro, crear `AppTheme.light()` y mantener `AppColors` con getters que dependan del brightness (o un `AppColorScheme` inyectado).
