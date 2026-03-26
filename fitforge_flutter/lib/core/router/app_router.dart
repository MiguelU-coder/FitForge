// lib/core/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/exercises/presentation/screens/exercises_screen.dart';
import '../../features/workouts/presentation/screens/active_session_screen.dart';
import '../../features/progress/presentation/screens/progress_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/workouts/presentation/screens/templates_screen.dart';
import '../../features/workouts/presentation/screens/create_template_screen.dart';
import '../../features/auth/presentation/screens/onboarding/onboarding_flow_screen.dart';
import '../shell/main_shell.dart';

class AppRoutes {
  static const login = '/login';
  static const register = '/register';
  static const home = '/home';
  static const exercises = '/exercises';
  static const progress = '/progress';
  static const profile = '/profile';
  static const activeSession = '/workouts/active';
  static const workouts = '/home';
  static const templates = '/templates';
  static const onboarding = '/onboarding';
  static const createTemplate = '/templates/create';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // Prevent GoRouter from being recreated on every auth state change.
  // We use a ValueNotifier to trigger router refreshes instead.
  final authNotifier = ValueNotifier<AuthState>(ref.read(authStateProvider));

  ref.listen<AuthState>(authStateProvider, (previous, next) {
    authNotifier.value = next;
  });

  return GoRouter(
    initialLocation: AppRoutes.home,
    debugLogDiagnostics: false,
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = authNotifier.value;
      final loggedIn = auth.isAuthenticated;
      final isAuth =
          state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register;
      final isOnboarding = state.matchedLocation == AppRoutes.onboarding;

      if (!loggedIn && !isAuth) return AppRoutes.login;

      if (loggedIn) {
        // If logged in but hasn't completed onboarding, force them there
        // unless they are already on the onboarding screen
        final needsOnboarding = !(auth.user?.hasCompletedOnboarding ?? true);
        if (needsOnboarding && !isOnboarding) {
          return AppRoutes.onboarding;
        }

        // If logged in and completed onboarding, but trying to access auth screens
        if (isAuth && !needsOnboarding) {
          return AppRoutes.home;
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: AppRoutes.exercises,
            builder: (context, state) => const ExercisesScreen(),
          ),
          GoRoute(
            path: AppRoutes.progress,
            builder: (context, state) => const ProgressScreen(),
          ),
          GoRoute(
            path: AppRoutes.profile,
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: AppRoutes.templates,
            builder: (context, state) => const TemplatesScreen(),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.createTemplate,
        builder: (context, state) => const CreateTemplateScreen(),
      ),
      GoRoute(
        path: AppRoutes.activeSession,
        builder: (context, state) => const ActiveSessionScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingFlowScreen(),
      ),
    ],
  );
});
