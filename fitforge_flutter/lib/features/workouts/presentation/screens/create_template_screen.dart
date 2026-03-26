// lib/features/workouts/presentation/screens/create_template_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../providers/routines_provider.dart';
import '../../../../core/widgets/primary_action_button.dart';
import '../../../exercises/presentation/providers/exercises_provider.dart';
import '../../../exercises/data/models/exercise_model.dart';

class _SelectionItem {
  final Exercise exercise;
  int sets = 3;
  int reps = 10;
  int rir = 2;

  _SelectionItem({required this.exercise});
}

class CreateTemplateScreen extends ConsumerStatefulWidget {
  const CreateTemplateScreen({super.key});

  @override
  ConsumerState<CreateTemplateScreen> createState() =>
      _CreateTemplateScreenState();
}

class _CreateTemplateScreenState extends ConsumerState<CreateTemplateScreen> {
  final _programNameCtrl = TextEditingController();
  final _routineNameCtrl = TextEditingController();
  final _goalCtrl = TextEditingController();
  int _weeks = 4;
  final List<_SelectionItem> _selectedExercises = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _programNameCtrl.dispose();
    _routineNameCtrl.dispose();
    _goalCtrl.dispose();
    super.dispose();
  }

  void _showExercisePicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SizedBox(
        height: MediaQuery.of(ctx).size.height * 0.8,
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Select Exercise',
                style: TextStyle(
                  color: AppTheme.textPri,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: Consumer(
                builder: (context, ref, _) {
                  final exAsync = ref.watch(exercisesProvider);
                  return exAsync.when(
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppTheme.neon),
                    ),
                    error: (e, _) => Center(
                      child: Text(
                        'Error: $e',
                        style: const TextStyle(color: AppTheme.error),
                      ),
                    ),
                    data: (page) {
                      final exercises = page.exercises;
                      return ListView.builder(
                        itemCount: exercises.length,
                        itemBuilder: (context, index) {
                          final ex = exercises[index];
                          return ListTile(
                            title: Text(
                              ex.name,
                              style: const TextStyle(color: AppTheme.textPri),
                            ),
                            subtitle: Text(
                              ex.primaryMuscles.join(', '),
                              style: const TextStyle(color: AppTheme.textSec),
                            ),
                            trailing: const Icon(
                              Icons.add_circle_outline,
                              color: AppTheme.neon,
                            ),
                            onTap: () {
                              setState(() {
                                _selectedExercises.add(
                                  _SelectionItem(exercise: ex),
                                );
                              });
                              Navigator.pop(ctx);
                            },
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveTemplate() async {
    final progName = _programNameCtrl.text.trim();
    final routineName = _routineNameCtrl.text.trim();
    final goal = _goalCtrl.text.trim();

    if (progName.isEmpty || routineName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Program and Routine names')),
      );
      return;
    }
    if (_selectedExercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one exercise')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final notif = ref.read(routineTemplatesProvider.notifier);

      await notif.createProgramAndRoutine(progName, routineName, goal, _weeks);

      // Re-fetch templates para obtener el routine ID listado
      final templates = await notif.fetchTemplates();
      // Encontrar el último con el mismo nombre y ejercicios vacíos
      final newRoutine = templates.reversed.firstWhere(
        (t) => t.name == routineName,
      );

      // 2. Add Exercises a esa rutina
      for (final item in _selectedExercises) {
        await notif.addExerciseToRoutine(
          newRoutine.id,
          item.exercise.id,
          item.sets,
          item.reps,
          item.rir,
        );
      }

      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text(
          'Design Routine',
          style: TextStyle(color: AppTheme.textPri, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  TextField(
                    controller: _programNameCtrl,
                    style: const TextStyle(color: AppTheme.textPri),
                    decoration: InputDecoration(
                      hintText: 'Program Name (e.g. Summer Shred)',
                      hintStyle: TextStyle(
                        color: AppTheme.textSec.withValues(alpha: 0.5),
                      ),
                      filled: true,
                      fillColor: AppTheme.bgElevated,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _routineNameCtrl,
                    style: const TextStyle(color: AppTheme.textPri),
                    decoration: InputDecoration(
                      hintText: 'Routine Name (e.g. Pull Day)',
                      hintStyle: TextStyle(
                        color: AppTheme.textSec.withValues(alpha: 0.5),
                      ),
                      filled: true,
                      fillColor: AppTheme.bgElevated,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _goalCtrl,
                          style: const TextStyle(color: AppTheme.textPri),
                          decoration: InputDecoration(
                            hintText: 'Goal (Optional)',
                            hintStyle: TextStyle(
                              color: AppTheme.textSec.withValues(alpha: 0.5),
                            ),
                            filled: true,
                            fillColor: AppTheme.bgElevated,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.bgElevated,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: _NumberScroller(
                          label: 'Weeks',
                          value: _weeks,
                          onChanged: (v) => setState(() => _weeks = v),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: _selectedExercises.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.fitness_center,
                            size: 48,
                            color: AppTheme.textSec.withValues(alpha: 0.3),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No exercises added yet.',
                            style: TextStyle(color: AppTheme.textSec),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _selectedExercises.length,
                      separatorBuilder: (c, i) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = _selectedExercises[index];
                        return GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${index + 1}. ${item.exercise.name}',
                                    style: const TextStyle(
                                      color: AppTheme.textPri,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.close,
                                      color: AppTheme.error,
                                      size: 20,
                                    ),
                                    onPressed: () => setState(
                                      () => _selectedExercises.removeAt(index),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: [
                                  _NumberScroller(
                                    label: 'Sets',
                                    value: item.sets,
                                    onChanged: (v) =>
                                        setState(() => item.sets = v),
                                  ),
                                  _NumberScroller(
                                    label: 'Reps',
                                    value: item.reps,
                                    onChanged: (v) =>
                                        setState(() => item.reps = v),
                                  ),
                                  _NumberScroller(
                                    label: 'RIR target',
                                    value: item.rir,
                                    onChanged: (v) =>
                                        setState(() => item.rir = v),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  OutlinedButton.icon(
                    onPressed: _showExercisePicker,
                    icon: const Icon(Icons.add, color: AppTheme.neon),
                    label: const Text(
                      'Add Exercise',
                      style: TextStyle(color: AppTheme.neon),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.neon),
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  PrimaryActionButton(
                    label: 'Save Template',
                    icon: Icons.save,
                    isLoading: _isLoading,
                    onPressed: _saveTemplate,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NumberScroller extends StatelessWidget {
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  const _NumberScroller({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSec, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            GestureDetector(
              onTap: () => onChanged((value - 1).clamp(0, 100)),
              child: const Icon(
                Icons.remove_circle_outline,
                color: AppTheme.neon,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              value.toString(),
              style: const TextStyle(
                color: AppTheme.textPri,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () => onChanged((value + 1).clamp(0, 100)),
              child: const Icon(
                Icons.add_circle_outline,
                color: AppTheme.neon,
                size: 22,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
