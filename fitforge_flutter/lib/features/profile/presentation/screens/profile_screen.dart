import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../workouts/presentation/providers/workouts_provider.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final history = ref.watch(workoutHistoryProvider);
    final user = auth.user;

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: AppColors.background,
            title: const Text('Profile'),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout_outlined, size: 20),
                onPressed: () => ref.read(authStateProvider.notifier).logout(),
                tooltip: 'Logout',
              ),
            ],
          ),

          // Avatar + name
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                      color: AppColors.elevated,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          blurRadius: 18,
                          spreadRadius: 0,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        (user?.displayName ?? 'U').substring(0, 1).toUpperCase(),
                        style: GoogleFonts.barlow(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.displayName ?? 'Athlete',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF888888),
                      fontSize: 13,
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Stats
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: history.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (sessions) {
                  final total = sessions.length;
                  final totalExercises = sessions.fold<int>(
                    0,
                    (s, w) => s + w.exerciseCount,
                  );
                  final totalMin = sessions.fold<int>(
                    0,
                    (s, w) => s + ((w.durationSeconds ?? 0) ~/ 60),
                  );
                  return GlassCard(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        StatBadge(value: '$total', label: 'Workouts'),
                        Container(
                          width: 0.5,
                          height: 36,
                          color: AppTheme.border,
                        ),
                        StatBadge(value: '$totalExercises', label: 'Exercises'),
                        Container(
                          width: 0.5,
                          height: 36,
                          color: AppTheme.border,
                        ),
                        StatBadge(value: '${totalMin}m', label: 'Total Time'),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),

          // Settings sections
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const _SectionLabel('PREFERENCES'),
                _SettingsTile(
                  icon: Icons.monitor_weight_outlined,
                  label: 'Weight Unit',
                  value: user?.weightUnit.toUpperCase() ?? 'KG',
                  onTap: () => _showSelectionDialog(
                    context,
                    ref,
                    'Weight Unit',
                    ['kg', 'lbs'],
                    user?.weightUnit ?? 'kg',
                    (val) => ref.read(authStateProvider.notifier).updateProfile(
                      {'weightUnit': val},
                    ),
                  ),
                ),
                _SettingsTile(
                  icon: Icons.straighten_outlined,
                  label: 'Height Unit',
                  value: user?.heightUnit.toUpperCase() ?? 'CM',
                  onTap: () => _showSelectionDialog(
                    context,
                    ref,
                    'Height Unit',
                    ['cm', 'in'],
                    user?.heightUnit ?? 'cm',
                    (val) => ref.read(authStateProvider.notifier).updateProfile(
                      {'heightUnit': val},
                    ),
                  ),
                ),
                _SettingsTile(
                  icon: Icons.timer_outlined,
                  label: 'Default Rest',
                  value: '${user?.defaultRestSeconds ?? 90}s',
                  onTap: () => _showSelectionDialog(
                    context,
                    ref,
                    'Default Rest',
                    ['30s', '60s', '90s', '120s', '180s', '240s'],
                    '${user?.defaultRestSeconds ?? 90}s',
                    (val) {
                      final seconds = int.parse(val.replaceAll('s', ''));
                      ref.read(authStateProvider.notifier).updateProfile({
                        'defaultRestSeconds': seconds,
                      });
                    },
                  ),
                ),
                const SizedBox(height: 16),
                const _SectionLabel('ACCOUNT'),
                _SettingsTile(
                  icon: Icons.person_outline,
                  label: 'Edit Profile',
                  onTap: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                        builder: (_) => const EditProfileScreen(),
                      ),
                    );
                  },
                ),
                _SettingsTile(
                  icon: Icons.lock_outline,
                  label: 'Change Password',
                  onTap: () => _showChangePasswordDialog(context),
                ),
                const SizedBox(height: 16),
                const _SectionLabel('APP'),
                const _SettingsTile(
                  icon: Icons.info_outline,
                  label: 'Version',
                  value: '1.0.0',
                ),
                SizedBox(height: MediaQuery.of(context).padding.bottom),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  void _showSelectionDialog(
    BuildContext context,
    WidgetRef ref,
    String title,
    List<String> options,
    String currentValue,
    Function(String) onSelect,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      useRootNavigator: true,
      builder: (bottomSheetContext) => Container(
        decoration: const BoxDecoration(
          color: AppColors.elevated,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          top: 24,
          bottom: MediaQuery.of(bottomSheetContext).padding.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Select $title',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            ...options.map((option) {
              final isSelected = option.toLowerCase() == currentValue.toLowerCase();
              return ListTile(
                title: Text(
                  option.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                  ),
                ),
                onTap: () {
                  onSelect(option);
                  Navigator.pop(context);
                },
              );
            }),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final pwdCtrl = TextEditingController();
    bool isLoading = false;
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.elevated,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.fromLTRB(
              24,
              24,
              24,
              MediaQuery.of(ctx).padding.bottom > 0 ? MediaQuery.of(ctx).padding.bottom + 24 : 48,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Change Password',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: pwdCtrl,
                  obscureText: true,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'New Password (min 6 chars)',
                    hintStyle: const TextStyle(color: AppColors.textMuted),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                if (errorMsg != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    errorMsg!,
                    style: TextStyle(color: Colors.red[400], fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: isLoading
                      ? null
                      : () async {
                          if (pwdCtrl.text.length < 6) {
                            setModalState(
                              () => errorMsg =
                                  'Password must be at least 6 characters',
                            );
                            return;
                          }

                          setModalState(() {
                            isLoading = true;
                            errorMsg = null;
                          });

                          try {
                            await Supabase.instance.client.auth.updateUser(
                              UserAttributes(password: pwdCtrl.text),
                            );
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Password updated successfully!',
                                  ),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            }
                          } catch (e) {
                            setModalState(() {
                              isLoading = false;
                              errorMsg =
                                  'Failed to update password. Please try again.';
                            });
                          }
                        },
                  child: isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Update Password',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel(this.label);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8, top: 4),
    child: Text(
      label,
      style: GoogleFonts.inter(
        color: const Color(0xFF888888),
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.5,
      ),
    ),
  );
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final VoidCallback? onTap;
  const _SettingsTile({
    required this.icon,
    required this.label,
    this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: AppTheme.glassCard(),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          if (value != null)
            Text(
              value!,
              style: GoogleFonts.inter(
                color: const Color(0xFF888888),
                fontSize: 13,
                fontWeight: FontWeight.w300,
              ),
            ),
          if (onTap != null)
            const SizedBox(width: 4),
          if (onTap != null)
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textMuted,
              size: 18,
            ),
        ],
      ),
    ),
  );
}
