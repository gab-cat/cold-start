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
  'chart.bar': 'bar-chart',
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
  // Meal time icons
  'sunrise': 'wb-sunny',
  'sun.max': 'light-mode',
  'takeoutbag.and.cup.and.straw': 'fastfood',
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
  'flame.fill': 'local-fire-department',
  'map': 'map',
  'bolt': 'flash-on',
  'bolt.fill': 'flash-on',
  'pencil': 'edit',
  'rectangle.portrait.and.arrow.right': 'logout',
  'gear': 'settings',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  'questionmark.circle': 'help-outline',
  'questionmark.circle.fill': 'help',
  // Profile & Health icons
  'ruler': 'straighten',
  'scalemass': 'monitor-weight',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'cross.case.fill': 'medical-services',
  'cross.case': 'medical-services',
  'globe': 'language',
  'textformat': 'translate',
  'bell.fill': 'notifications',
  'bell': 'notifications-none',
  'message.fill': 'message',
  'message': 'message',
  'newspaper': 'article',
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
  // Chat & FAB icons
  'bubble.left.and.bubble.right.fill': 'forum',
  'bubble.left.fill': 'chat-bubble',
  'hand.wave.fill': 'front-hand',
  'xmark': 'close',
  'arrow.up': 'arrow-upward',
  'arrow.up.circle.fill': 'arrow-circle-up',
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
