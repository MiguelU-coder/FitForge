import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  String _selectedGender = 'MALE';
  String _selectedLevel = 'BEGINNER';

  @override
  void initState() {
    super.initState();
    final user = ref.read(authStateProvider).user;
    _nameCtrl = TextEditingController(text: user?.displayName ?? '');
    _selectedGender = user?.gender ?? 'MALE';
    _selectedLevel = user?.trainingLevel ?? 'BEGINNER';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    // We only save strings to userMetadata to avoid parsing issues
    await ref.read(authStateProvider.notifier).updateProfile({
      'display_name': _nameCtrl.text.trim(),
      'gender': _selectedGender,
      'trainingLevel': _selectedLevel,
    });
    
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Edit Profile', style: TextStyle(fontSize: 18)),
        actions: [
          if (authState.isLoading)
            const Center(child: Padding(padding: EdgeInsets.symmetric(horizontal: 20), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))))
          else
            TextButton(
              onPressed: _saveProfile,
              child: const Text('Save', style: TextStyle(color: AppTheme.neon, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLabel('DISPLAY NAME'),
              TextFormField(
                controller: _nameCtrl,
                style: const TextStyle(color: AppTheme.textPri),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppTheme.bgElevated,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Name is required' : null,
              ),
              
              const SizedBox(height: 24),
              _buildLabel('GENDER'),
              _buildSegmentedControl(
                ['MALE', 'FEMALE', 'OTHER'],
                _selectedGender,
                (val) => setState(() => _selectedGender = val),
              ),

              const SizedBox(height: 24),
              _buildLabel('TRAINING LEVEL'),
              _buildSegmentedControl(
                ['BEGINNER', 'MEDIUM', 'ADVANCED'],
                _selectedLevel,
                (val) => setState(() => _selectedLevel = val),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
      child: Text(
        text,
        style: const TextStyle(
          color: AppTheme.textSec,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSegmentedControl(List<String> options, String selected, Function(String) onSelect) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgElevated,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: options.map((opt) {
          final isSelected = opt == selected;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(opt),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.neon.withValues(alpha: 0.15) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected ? AppTheme.neon.withValues(alpha: 0.5) : Colors.transparent,
                  ),
                ),
                child: Text(
                  opt,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isSelected ? AppTheme.neon : AppTheme.textSec,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
