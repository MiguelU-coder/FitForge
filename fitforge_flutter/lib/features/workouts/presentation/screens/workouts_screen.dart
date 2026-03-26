// lib/features/workouts/presentation/screens/workouts_screen.dart
// Redirige a HomeScreen — la lógica de workouts vive en home + active session
import 'package:flutter/material.dart';
import '../../../home/presentation/screens/home_screen.dart';

class WorkoutsScreen extends StatelessWidget {
  const WorkoutsScreen({super.key});
  @override
  Widget build(BuildContext context) => const HomeScreen();
}
