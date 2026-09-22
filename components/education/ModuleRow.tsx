import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import { useColors } from '../../contexts/ThemeContext';
import type { EduModule } from '../../lib/education';

export type ModuleStatus = 'completed' | 'unlocked' | 'locked';

const CIRCLE = 18;

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.round(seconds / 60)} min`;
}

interface ModuleRowProps {
  module: EduModule;
  status: ModuleStatus;
  index: number;
  total: number;
  onPress: () => void;
}

export default function ModuleRow({ module, status, index, total, onPress }: ModuleRowProps) {
  const colors = useColors();
  const LINE_COLOR = colors.border;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const duration = formatDuration(module.video_duration_seconds);

  const iconName = isCompleted ? 'checkmark' : isLocked ? 'lock-closed' : 'play';
  const iconColor = isCompleted ? colors.background : isLocked ? colors.textFaint : colors.gold;

  const circleStyle = {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: isCompleted ? colors.gold : 'transparent',
    borderWidth: isCompleted ? 0 : 1.5,
    borderColor: isCompleted
      ? undefined
      : isLocked
        ? colors.textFaint
        : colors.gold,
  };

  const rowContent = (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
      {/* Timeline gutter */}
      <View style={{ width: 36, alignItems: 'center' }}>
        {/* Top connector */}
        <View
          style={{
            width: 1.5,
            height: 14,
            backgroundColor: isFirst ? 'transparent' : LINE_COLOR,
          }}
        />
        {/* Status circle */}
        <View style={circleStyle}>
          <Ionicons name={iconName as any} size={9} color={iconColor} />
        </View>
        {/* Bottom connector — flex:1 to stretch to row height */}
        <View
          style={{
            width: 1.5,
            flex: 1,
            minHeight: 14,
            backgroundColor: isLast ? 'transparent' : LINE_COLOR,
          }}
        />
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingLeft: 12,
          paddingTop: 8,
          paddingBottom: 18,
          opacity: isLocked ? 0.4 : 1,
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 15,
            color: colors.textPrimary,
            marginBottom: duration ? 3 : 0,
          }}
          numberOfLines={2}
        >
          {module.title}
        </Text>
        {!!duration && (
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: colors.textTertiary,
            }}
          >
            {duration}
          </Text>
        )}
      </View>
    </View>
  );

  if (isLocked) {
    return <View>{rowContent}</View>;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{}}>
      {rowContent}
    </TouchableOpacity>
  );
}
