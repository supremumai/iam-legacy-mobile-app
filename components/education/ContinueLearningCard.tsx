import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ContinueLearningResult } from '../../lib/education';

interface Props {
  item: ContinueLearningResult;
  onPress: () => void;
}

export default function ContinueLearningCard({ item, onPress }: Props) {
  const { t } = useLanguage();
  const isQuiz = item.videoWatched;
  const iconName: React.ComponentProps<typeof Ionicons>['name'] = isQuiz
    ? 'ribbon-outline'
    : 'play-circle-outline';
  const iconColor = isQuiz ? Colors.success : Colors.gold;
  const iconBg = isQuiz ? Colors.successBg : Colors.borderSubtle;
  const subtitle = t('education.continue_subtitle', {
    course: item.courseTitle,
    n: item.moduleOrderIndex + 1,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceAlt,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 14,
            color: Colors.textPrimary,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {item.moduleTitle}
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 12,
            color: Colors.textTertiary,
          }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.borderStrong} />
    </TouchableOpacity>
  );
}
