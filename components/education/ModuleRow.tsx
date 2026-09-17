import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import type { EduModule } from '../../lib/education';

export type ModuleStatus = 'completed' | 'unlocked' | 'locked';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.round(seconds / 60)} min`;
}

interface ModuleRowProps {
  module: EduModule;
  status: ModuleStatus;
  onPress: () => void;
}

export default function ModuleRow({ module, status, onPress }: ModuleRowProps) {
  const isLocked = status === 'locked';
  const duration = formatDuration(module.video_duration_seconds);

  const icon =
    status === 'completed'
      ? 'checkmark-circle'
      : status === 'unlocked'
        ? 'play-circle'
        : 'lock-closed';

  const iconColor =
    status === 'locked' ? 'rgba(255,255,255,0.3)' : '#c9a84c';

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(201,168,76,0.08)',
        opacity: isLocked ? 0.4 : 1,
        gap: 14,
      }}
    >
      {/* Order number */}
      <Text
        style={{
          fontFamily: Fonts.bodyBold,
          fontSize: 13,
          color: 'rgba(201,168,76,0.6)',
          width: 22,
          textAlign: 'center',
        }}
      >
        {module.order_index}
      </Text>

      {/* Title + duration */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 15,
            color: '#FFFFFF',
            marginBottom: duration ? 2 : 0,
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
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {duration}
          </Text>
        )}
      </View>

      {/* Status icon */}
      <Ionicons name={icon as any} size={22} color={iconColor} />
    </View>
  );

  if (isLocked) {
    return <View>{content}</View>;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}
