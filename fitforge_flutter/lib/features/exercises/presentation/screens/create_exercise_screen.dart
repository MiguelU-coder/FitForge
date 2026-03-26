// lib/features/exercises/presentation/screens/create_exercise_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../data/sources/exercises_remote_source.dart';
import '../providers/exercises_provider.dart';

class CreateExerciseScreen extends ConsumerStatefulWidget {
  const CreateExerciseScreen({super.key});

  @override
  ConsumerState<CreateExerciseScreen> createState() => _CreateExerciseScreenState();
}

class _CreateExerciseScreenState extends ConsumerState<CreateExerciseScreen> {
  final _formKey = GlobalKey<FormState>();
  String _name = '';
  String? _primaryMuscle;
  String? _equipment;
  String _instructions = '';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'NEW EXERCISE',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Exercise Details',
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 24),

              // Name field
              _buildLabel('NAME'),
              const SizedBox(height: 8),
              TextFormField(
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _fieldDecoration('e.g. Incline DB Press'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                onChanged: (v) => _name = v,
              ),
              const SizedBox(height: 24),

              // Primary Muscle
              _buildLabel('PRIMARY MUSCLE'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kMuscleGroups.map((m) {
                  return MuscleTag(
                    muscle: m,
                    isSelected: _primaryMuscle == m,
                    small: false,
                    onTap: () => setState(() => _primaryMuscle = m),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Equipment
              _buildLabel('EQUIPMENT'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kEquipment.map((e) {
                  final isSelected = _equipment == e;
                  return GestureDetector(
                    onTap: () => setState(() => _equipment = e),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.border,
                          width: 1.2,
                        ),
                      ),
                      child: Text(
                        equipmentLabel(e),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Instructions
              _buildLabel('INSTRUCTIONS (OPTIONAL)'),
              const SizedBox(height: 8),
              TextFormField(
                style: const TextStyle(color: AppColors.textPrimary),
                maxLines: 4,
                decoration: _fieldDecoration('How to perform the exercise...'),
                onChanged: (v) => _instructions = v,
              ),
              const SizedBox(height: 40),

              NeonButton(
                label: 'CREATE EXERCISE',
                isLoading: _isLoading,
                onPressed: _submit,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppColors.textMuted,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
      ),
    );
  }

  InputDecoration _fieldDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14, fontWeight: FontWeight.w300),
      filled: true,
      fillColor: AppColors.card,
      contentPadding: const EdgeInsets.all(16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
    );
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_primaryMuscle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a primary muscle')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(exercisesRemoteSourceProvider).createCustom(
        name: _name,
        primaryMuscles: [_primaryMuscle!],
        equipment: _equipment,
        instructions: _instructions,
      );

      if (mounted) {
        ref.invalidate(exercisesProvider);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Exercise created successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
