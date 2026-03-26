// lib/core/shell/main_shell.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../router/app_router.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  int _index(String loc) {
    if (loc.startsWith(AppRoutes.exercises)) return 1;
    if (loc.startsWith(AppRoutes.templates)) return 2;
    if (loc.startsWith(AppRoutes.progress)) return 3;
    if (loc.startsWith(AppRoutes.profile)) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: NavigationBar(
          selectedIndex: _index(loc),
          onDestinationSelected: (i) {
            switch (i) {
              case 0:
                context.go(AppRoutes.home);
              case 1:
                context.go(AppRoutes.exercises);
              case 2:
                context.go(AppRoutes.templates);
              case 3:
                context.go(AppRoutes.progress);
              case 4:
                context.go(AppRoutes.profile);
            }
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.search_outlined),
              selectedIcon: Icon(Icons.search),
              label: 'Exercises',
            ),
            NavigationDestination(
              icon: Icon(Icons.library_books_outlined),
              selectedIcon: Icon(Icons.library_books),
              label: 'Templates',
            ),
            NavigationDestination(
              icon: Icon(Icons.bar_chart_outlined),
              selectedIcon: Icon(Icons.bar_chart),
              label: 'Progress',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
