// lib/features/auth/presentation/widgets/auth_text_field.dart
import 'package:flutter/material.dart';

class AuthTextField extends StatelessWidget {
  final TextEditingController controller;
  final String                label;
  final String                hint;
  final bool                  obscureText;
  final TextInputType?        keyboardType;
  final IconData?             prefixIcon;
  final Widget?               suffixIcon;
  final String? Function(String?)? validator;
  final void Function(String)?     onFieldSubmitted;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    this.obscureText      = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onFieldSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller:       controller,
      obscureText:      obscureText,
      keyboardType:     keyboardType,
      validator:        validator,
      onFieldSubmitted: onFieldSubmitted,
      textInputAction:  onFieldSubmitted != null
          ? TextInputAction.done
          : TextInputAction.next,
      decoration: InputDecoration(
        labelText: label,
        hintText:  hint,
        prefixIcon: prefixIcon != null ? Icon(prefixIcon) : null,
        suffixIcon: suffixIcon,
      ),
    );
  }
}
