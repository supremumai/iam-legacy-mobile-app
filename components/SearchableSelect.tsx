import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

interface Props {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const handleSelect = (item: string) => {
    onChange(item);
    setOpen(false);
  };

  return (
    <>
      {/* ── Closed trigger ─── */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 13,
            color: colors.textMuted,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => !disabled && setOpen(true)}
          activeOpacity={disabled ? 1 : 0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: disabled ? colors.borderSubtle : colors.border,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            opacity: disabled ? 0.45 : 1,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily: Fonts.body,
              fontSize: 14,
              color: value ? colors.textPrimary : colors.textTertiary,
            }}
          >
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Modal ─── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#1c1a14',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTopWidth: 1,
              borderColor: colors.border,
              maxHeight: '75%',
              paddingBottom: insets.bottom,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 12,
                gap: 12,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: colors.gold, flex: 1 }}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.gold,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar..."
                placeholderTextColor={colors.textTertiary}
                style={{
                  flex: 1,
                  fontFamily: Fonts.body,
                  fontSize: 14,
                  color: colors.textPrimary,
                  paddingVertical: 10,
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Options list */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderSubtle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary }}>
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={18} color={colors.gold} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    color: colors.textMuted,
                    textAlign: 'center',
                    paddingVertical: 24,
                  }}
                >
                  Sin resultados
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
