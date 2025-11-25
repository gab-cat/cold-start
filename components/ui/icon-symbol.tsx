// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import React, { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'safari.fill': 'explore',
  'list.bullet': 'list',
  'chart.bar.fill': 'bar-chart',
  'person.fill': 'person',
  'calendar.badge.exclamationmark': 'event-busy',
  'clock': 'schedule',
  'clock.fill': 'schedule',
  'circle.fill': 'circle',
  'circle': 'circle',
  // Exercise activities
  'figure.run': 'directions-run',
  'figure.walk': 'directions-walk',
  'bicycle': 'directions-bike',
  'figure.pool.swim': 'pool',
  'figure.mind.and.body': 'self-improvement',
  'dumbbell': 'fitness-center',
  'figure.cooldown': 'accessibility-new',
  // Wellness activities
  'moon.stars': 'bedtime',
  'fork.knife': 'restaurant',
  'drop': 'water-drop',
  'brain.head.profile': 'psychology',
  // Leisure activities
  'gamecontroller': 'sports-esports',
  'desktopcomputer': 'computer',
  'book': 'menu-book',
  'tv': 'tv',
  'music.note': 'music-note',
  'person.2': 'people',
  'puzzlepiece': 'extension',
  'sparkles': 'auto-awesome',
  // UI icons
  'magnifyingglass': 'search',
  'flame': 'local-fire-department',
  'map': 'map',
  'bolt': 'flash-on',
  'bolt.fill': 'flash-on',
  'pencil': 'edit',
  'rectangle.portrait.and.arrow.right': 'logout',
  'gear': 'settings',
  // Recommendation icons
  'lightbulb': 'lightbulb',
  'calendar': 'calendar-today',
  'target': 'gps-fixed',
  'star': 'star',
  'checkmark': 'check',
  'doc.on.doc': 'content-copy',
  'xmark.circle': 'cancel',
  'arrow.clockwise': 'refresh',
  // Errands and tasks
  'cart.fill': 'shopping-cart',
  'checkmark.circle': 'check-circle',
  'book.closed': 'auto-stories',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
