// lib/features/auth/presentation/screens/register_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../widgets/auth_text_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscurePass = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();

    await ref
        .read(authStateProvider.notifier)
        .register(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          displayName: _nameCtrl.text.trim(),
        );
    if (mounted) context.go(AppRoutes.onboarding);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    ref.listen(authStateProvider, (prev, next) {
      if (next.error != null && prev?.error != next.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
        ref.read(authStateProvider.notifier).clearError();
      }
    });

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),

                // ── Header ────────────────────────────────────────────────
                IconButton(
                  onPressed: () => context.go(AppRoutes.login),
                  icon: const Icon(Icons.arrow_back_ios_new),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Create account',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ).animate().fadeIn(),
                const SizedBox(height: 8),
                Text(
                  'Start tracking your progress today',
                  style: TextStyle(fontSize: 16, color: Colors.grey[500]),
                ).animate().fadeIn(delay: 50.ms),

                const SizedBox(height: 36),

                // ── Name ──────────────────────────────────────────────────
                AuthTextField(
                  controller: _nameCtrl,
                  label: 'Display name',
                  hint: 'How should we call you?',
                  prefixIcon: Icons.person_outlined,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Name is required';
                    }
                    if (v.trim().length < 2) {
                      return 'Name must be at least 2 characters';
                    }
                    return null;
                  },
                ).animate().fadeIn(delay: 100.ms),

                const SizedBox(height: 16),

                // ── Email ─────────────────────────────────────────────────
                AuthTextField(
                  controller: _emailCtrl,
                  label: 'Email',
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Email is required';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ).animate().fadeIn(delay: 150.ms),

                const SizedBox(height: 16),

                // ── Password ──────────────────────────────────────────────
                AuthTextField(
                  controller: _passwordCtrl,
                  label: 'Password',
                  hint: 'Min 8 chars, 1 uppercase, 1 number',
                  obscureText: _obscurePass,
                  prefixIcon: Icons.lock_outlined,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePass
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: Colors.grey,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePass = !_obscurePass),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 8) return 'Min 8 characters';
                    if (!v.contains(RegExp(r'[A-Z]'))) {
                      return 'Include at least one uppercase letter';
                    }
                    if (!v.contains(RegExp(r'[0-9]'))) {
                      return 'Include at least one number';
                    }
                    return null;
                  },
                ).animate().fadeIn(delay: 200.ms),

                const SizedBox(height: 16),

                // ── Confirm password ──────────────────────────────────────
                AuthTextField(
                  controller: _confirmCtrl,
                  label: 'Confirm password',
                  hint: '••••••••',
                  obscureText: _obscurePass,
                  prefixIcon: Icons.lock_outlined,
                  validator: (v) {
                    if (v != _passwordCtrl.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                  onFieldSubmitted: (_) => _submit(),
                ).animate().fadeIn(delay: 250.ms),

                const SizedBox(height: 32),

                // ── Submit button ─────────────────────────────────────────
                FilledButton(
                  onPressed: auth.isLoading ? null : _submit,
                  child: auth.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Create Account'),
                ).animate().fadeIn(delay: 300.ms),

                const SizedBox(height: 24),

                // ── Login link ────────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                    GestureDetector(
                      onTap: () => context.go(AppRoutes.login),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          color: AppTheme.neon,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ).animate().fadeIn(delay: 350.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
