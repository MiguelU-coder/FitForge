// lib/features/auth/presentation/screens/login_screen.dart
// Design: "Industrial Premium Athletic"
// Direction: Asymmetric layout, bold typography, decisive motion, industrial details

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_colors.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _isHoveringButton = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();

    await ref
        .read(authStateProvider.notifier)
        .login(email: _emailCtrl.text.trim(), password: _passwordCtrl.text);
  }

  @override
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
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        ref.read(authStateProvider.notifier).clearError();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // ── Brand mark + Tagline ────────────────────────────
              _buildBrandMark(),

              const SizedBox(height: 32),

              // ── Main headline ─────────────────────────────────
              _buildHeadline(),

              const SizedBox(height: 32),

              // ── Form container ──────────────────────────────────
              _buildFormContainer(auth),

              const SizedBox(height: 24),

              // ── Social login options ──────────────────────────
              _buildSocialLogin(),

              const SizedBox(height: 24),

              // ── Footer link ─────────────────────────────────────
              _buildFooterLink(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBrandMark() {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(
            Icons.bolt,
            color: Colors.white,
            size: 28,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'FITFORGE',
              style: GoogleFonts.bebasNeue(
                fontSize: 24,
                letterSpacing: 2,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              'FORGE YOUR LEGACY',
              style: GoogleFonts.dmSans(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                letterSpacing: 3,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ],
    )
        .animate()
        .fadeIn(duration: 400.ms)
        .slideY(begin: -0.3, duration: 500.ms);
  }

  Widget _buildHeadline() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Eyebrow
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Text(
            'WELCOME BACK',
            style: GoogleFonts.dmSans(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 2,
              color: AppColors.primary,
            ),
          ),
        )
            .animate()
            .fadeIn(delay: 100.ms, duration: 400.ms)
            .slideX(begin: -0.2),

        const SizedBox(height: 12),

        // Main title - using Bebas Neue for impact
        Text(
          'RESUME\nYOUR\nTRAINING',
          style: GoogleFonts.bebasNeue(
            fontSize: 48,
            height: 0.9,
            letterSpacing: 1,
            color: AppColors.textPrimary,
          ),
        )
            .animate()
            .fadeIn(delay: 200.ms, duration: 500.ms)
            .slideY(begin: 0.2),

        const SizedBox(height: 12),

        // Subtitle
        Text(
          'Sign in to track your progress and continue building strength.',
          style: GoogleFonts.dmSans(
            fontSize: 14,
            height: 1.5,
            color: AppColors.textSecondary,
          ),
        )
            .animate()
            .fadeIn(delay: 350.ms, duration: 400.ms),
      ],
    );
  }

  Widget _buildFormContainer(AuthState auth) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.elevated.withValues(alpha: 0.9),
            AppColors.card.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.border.withValues(alpha: 0.8),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Email field
            _buildInputLabel('EMAIL'),
            const SizedBox(height: 6),
            _buildTextField(
              controller: _emailCtrl,
              hint: 'your@email.com',
              keyboardType: TextInputType.emailAddress,
              prefixIcon: Icons.alternate_email,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                if (!v.contains('@')) return 'Invalid email';
                return null;
              },
            ),

            const SizedBox(height: 16),

            // Password field
            _buildInputLabel('PASSWORD'),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _passwordCtrl,
              hint: 'Enter your password',
              obscureText: _obscurePass,
              prefixIcon: Icons.lock_outline,
              suffixIcon: GestureDetector(
                onTap: () => setState(() => _obscurePass = !_obscurePass),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    _obscurePass ? Icons.visibility_off : Icons.visibility,
                    key: ValueKey(_obscurePass),
                    color: AppColors.textTertiary,
                    size: 20,
                  ),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                return null;
              },
              onSubmitted: (_) {
                _submit();
              },
            ),

            const SizedBox(height: 8),

            // Forgot password
            Align(
              alignment: Alignment.centerRight,
              child: GestureDetector(
                onTap: () {},
                child: Text(
                  'Forgot password?',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Sign in button
            _buildSignInButton(auth),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 400.ms, duration: 500.ms)
        .slideY(begin: 0.15);
  }

  Widget _buildInputLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.5,
        color: AppColors.textTertiary,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    void Function(String)? onSubmitted,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: onSubmitted,
      style: GoogleFonts.dmSans(
        fontSize: 15,
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.dmSans(
          fontSize: 15,
          color: AppColors.textMuted,
        ),
        prefixIcon: Icon(
          prefixIcon,
          color: AppColors.textTertiary,
          size: 20,
        ),
        suffixIcon: suffixIcon != null
            ? Padding(
                padding: const EdgeInsets.only(right: 12),
                child: suffixIcon,
              )
            : null,
        filled: true,
        fillColor: AppColors.background.withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppColors.border.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.primary,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.error,
            width: 1,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
    );
  }

  Widget _buildSignInButton(AuthState auth) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHoveringButton = true),
      onExit: (_) => setState(() => _isHoveringButton = false),
      child: GestureDetector(
        onTap: auth.isLoading ? null : _submit,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 52,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(14),
            boxShadow: _isHoveringButton && !auth.isLoading
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.4),
                      blurRadius: 20,
                      spreadRadius: 2,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : AppTheme.primaryGlow,
          ),
          child: Center(
            child: auth.isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'SIGN IN',
                        style: GoogleFonts.dmSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.arrow_forward,
                        color: Colors.white,
                        size: 18,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildSocialLogin() {
    return Column(
      children: [
        // Divider with text
        Row(
          children: [
            Expanded(
              child: Container(
                height: 1,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      AppColors.border,
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'OR CONTINUE WITH',
                style: GoogleFonts.dmSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1,
                  color: AppColors.textTertiary,
                ),
              ),
            ),
            Expanded(
              child: Container(
                height: 1,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.border,
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ],
        )
            .animate()
            .fadeIn(delay: 600.ms, duration: 400.ms),

        const SizedBox(height: 20),

        // Social buttons
        Row(
          children: [
            Expanded(
              child: _buildSocialButton(
                icon: Icons.g_mobiledata,
                label: 'Google',
                onTap: () => ref.read(authStateProvider.notifier).signInWithGoogle(),
              ),
            ),
          ],
        )
            .animate()
            .fadeIn(delay: 700.ms, duration: 400.ms)
            .slideY(begin: 0.1),
      ],
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.elevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.border,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: AppColors.textPrimary,
              size: 22,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.dmSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooterLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Don't have an account? ",
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        GestureDetector(
          onTap: () => context.go(AppRoutes.register),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Sign Up',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      ],
    )
        .animate()
        .fadeIn(delay: 800.ms, duration: 400.ms);
  }
}
