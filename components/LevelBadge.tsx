import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLevelInfo } from '../lib/points';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

interface LevelBadgeProps {
  points: number;
  size?: 'small' | 'medium';
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

export default function LevelBadge({ points, size = 'medium' }: LevelBadgeProps) {
  const { level } = getLevelInfo(points);
  const isSmall = size === 'small';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 999,
        paddingHorizontal: isSmall ? 10 : 12,
        paddingVertical: isSmall ? 4 : 6,
        gap: 4,
      }}
    >
      <Ionicons name="star" size={isSmall ? 12 : 14} color={Colors.gold} />
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: isSmall ? 11 : 12,
          color: Colors.gold,
        }}
      >
        {`Level ${level} · ${formatCount(points)} pts`}
      </Text>
    </View>
  );
}
