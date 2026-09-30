/**
 * ActionSheet
 *
 * App-themed bottom sheet modal that replaces native Alert.alert for
 * contextual action menus (3-dots / kebab menus on posts, events, etc.).
 *
 * Styling: bg #1c1a14, gold border on top corners (radius 16), handle bar.
 */
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';

export interface ActionSheetAction {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
  title?: string;
}

export default function ActionSheet({ visible, onClose, actions, title }: Props) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
        onPress={onClose}
      />

      {/* Sheet */}
      <View
        style={{
          backgroundColor: '#1c1a14',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.gold,
          paddingBottom: 32,
        }}
      >
        {/* Handle bar */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
            }}
          />
        </View>

        {/* Optional title */}
        {title ? (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: colors.textMuted,
              textAlign: 'center',
              paddingBottom: 8,
              paddingHorizontal: 20,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {title}
          </Text>
        ) : null}

        {/* Actions */}
        {actions.map((action, i) => (
          <Pressable
            key={i}
            onPress={() => {
              onClose();
              // Small delay so close animation runs before the action
              setTimeout(action.onPress, 50);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
              opacity: pressed ? 0.7 : 1,
              borderTopWidth: i === 0 ? 1 : 0,
              borderTopColor: colors.borderSubtle,
            })}
          >
            {action.icon ? (
              <Ionicons
                name={action.icon}
                size={20}
                color={action.destructive ? colors.error : colors.gold}
                style={{ marginRight: 14 }}
              />
            ) : null}
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 16,
                color: action.destructive ? colors.error : colors.textPrimary,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
