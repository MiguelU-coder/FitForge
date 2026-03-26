// lib/main.dart
// Design System: tema en AppTheme.dark(); colores en AppColors; componentes en
// core/widgets: WorkoutCard, ExerciseCard, PrimaryActionButton, StatsDisplay.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/services/notification_service.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env file for RapidAPI and Supabase credentials
  await dotenv.load(fileName: '.env');

  // Initialize Supabase
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL'] ?? 'https://ilkdhwvmtdgobuoqcfbv.supabase.co',
    anonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? 'sb_publishable_sfJ8-4hk8WsVo-pzlEHWhw_lyvIBIjb',
  );

  await NotificationService().init();
  runApp(const ProviderScope(child: FitForgeApp()));
}

class FitForgeApp extends ConsumerWidget {
  const FitForgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'FitForge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
