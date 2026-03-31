// lib/core/shell/main_shell.dart
// "Midnight Forge" — Premium floating navigation bar
// Floating card with blur effect, orange pill indicator, animated transitions.

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../router/app_router.dart';
import '../utils/app_constants.dart';

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
    final selectedIndex = _index(loc);

    // Inject extra bottom padding so SafeArea / ListView / CustomScrollView
    // in every child screen automatically clears the floating navbar.
    final mq = MediaQuery.of(context);
    final adjustedChild = MediaQuery(
      data: mq.copyWith(
        padding: mq.padding.copyWith(
          bottom: mq.padding.bottom + AppConstants.kNavBarExtra,
        ),
      ),
      child: child,
    );

    return Scaffold(
      body: adjustedChild,
      extendBody: true,
      bottomNavigationBar: _ForgeNavBar(
        selectedIndex: selectedIndex,
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
      ),
    );
  }
}

class _ForgeNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;

  const _ForgeNavBar({
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  static const _destinations = [
    _NavItem(
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
      label: 'Home',
    ),
    _NavItem(
      icon: Icons.fitness_center_outlined,
      activeIcon: Icons.fitness_center_rounded,
      label: 'Exercises',
    ),
    _NavItem(
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
      label: 'Templates',
    ),
    _NavItem(
      icon: Icons.show_chart_rounded,
      activeIcon: Icons.show_chart_rounded,
      label: 'Progress',
    ),
    _NavItem(
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
      label: 'Profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: bottomPadding + 12,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            height: 68,
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: const Color(0xFF2E3A55).withValues(alpha: 0.7),
                width: 0.8,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.5),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.04),
                  blurRadius: 48,
                  spreadRadius: 0,
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(
                _destinations.length,
                (i) => _NavItemWidget(
                  item: _destinations[i],
                  isSelected: selectedIndex == i,
                  onTap: () => onDestinationSelected(i),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _NavItemWidget extends StatelessWidget {
  final _NavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItemWidget({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, anim) => ScaleTransition(
                scale: anim,
                child: child,
              ),
              child: Icon(
                isSelected ? item.activeIcon : item.icon,
                key: ValueKey(isSelected),
                size: 22,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.textTertiary,
              ),
            ),
            const SizedBox(height: 3),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: GoogleFonts.dmSans(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.textTertiary,
                letterSpacing: 0.2,
              ),
              child: Text(item.label),
            ),
          ],
        ),
      )
          .animate(target: isSelected ? 1 : 0)
          .scaleXY(begin: 1, end: 1.05, duration: 150.ms),
    );
  }
}
