import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

interface SimModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function SimModal({ visible, title, message, onClose }: SimModalProps) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: '#1c1a14', borderRadius: 16, padding: 28, width: '100%', borderWidth: 1.5, borderColor: colors.gold + '60' }}>
          {title ? (
            <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: colors.gold, marginBottom: 10, textAlign: 'center' }}>
              {title}
            </Text>
          ) : (
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} style={{ alignSelf: 'center', marginBottom: 10 }} />
          )}
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 24 }}>
            {message}
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={{ backgroundColor: colors.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
