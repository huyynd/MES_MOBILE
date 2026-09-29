import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  style?: any;
  textStyle?: any;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style, textStyle }: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled || loading) return '#cbd5e1'; // slate-300
    if (variant === 'secondary') return '#f1f5f9'; // slate-100
    if (variant === 'danger') return '#ef4444'; // red-500
    if (variant === 'outline' || variant === 'ghost') return 'transparent';
    return '#1d4ed8'; // blue-700 for primary (Premium Blue)
  };

  const getTextColor = () => {
    if (disabled || loading) return '#ffffff';
    if (variant === 'secondary') return '#334155'; // slate-700
    if (variant === 'outline') return '#1d4ed8'; // blue-700
    if (variant === 'ghost') return '#64748b'; // slate-500
    return '#ffffff';
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return { borderWidth: 1, borderColor: '#1d4ed8' };
    }
    return {};
  };

  const hasShadow = variant === 'primary' || variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        hasShadow && !disabled && !loading ? styles.shadow : null,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shadow: {
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
