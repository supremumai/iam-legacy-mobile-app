/**
 * MentionInput
 *
 * Wraps a TextInput. When the user types "@" followed by one or more characters,
 * a suggestion panel appears showing matching profiles. Selecting a suggestion
 * inserts the mention marker `@[Full Name](user_id)` inline and closes the panel.
 *
 * The raw value (with markers) is what callers store and send to the DB.
 * Use MentionText to render it in read-only contexts.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';

export interface MentionSuggestion {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: object;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  inputRef?: React.RefObject<TextInput>;
}

// Extract the "@query" the cursor is currently inside, or null.
function getActiveMentionQuery(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@([^\s@]*)$/);
  if (!match) return null;
  return match[1]; // may be empty string (just typed "@")
}

export default function MentionInput({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  multiline,
  maxLength,
  autoFocus,
  inputRef: externalRef,
}: Props) {
  const colors = useColors();
  const internalRef = useRef<TextInput>(null);
  const inputRef = externalRef ?? internalRef;

  const [cursorPos, setCursorPos] = useState(0);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeQuery = getActiveMentionQuery(value, cursorPos);
  const showPanel = activeQuery !== null && (suggestions.length > 0 || loadingSuggestions);

  useEffect(() => {
    if (activeQuery === null) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        let q = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, location')
          .limit(8);
        if (activeQuery.length > 0) {
          q = q.ilike('full_name', `%${activeQuery}%`);
        } else {
          q = q.order('created_at', { ascending: false });
        }
        const { data } = await q;
        setSuggestions((data ?? []) as MentionSuggestion[]);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeQuery]);

  const handleSelect = (suggestion: MentionSuggestion) => {
    const name = suggestion.full_name ?? 'Legacy Member';
    const marker = `@[${name}](${suggestion.id})`;

    // Replace "@query" with the marker
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);
    // Find the start of the active "@query"
    const atIdx = before.lastIndexOf('@');
    const newText = before.slice(0, atIdx) + marker + ' ' + after;
    onChangeText(newText);
    setSuggestions([]);

    // Move cursor to end of inserted marker
    const newPos = atIdx + marker.length + 1;
    setTimeout(() => {
      inputRef.current?.setNativeProps({ selection: { start: newPos, end: newPos } });
    }, 0);
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Suggestion panel — rendered ABOVE the input */}
      {showPanel && (
        <View
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 4,
            backgroundColor: '#1c1a14',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.gold,
            overflow: 'hidden',
            maxHeight: 200,
            zIndex: 999,
          }}
        >
          {loadingSuggestions && suggestions.length === 0 ? (
            <View style={{ padding: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(s) => s.id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item: s }) => {
                const initials = getInitials(s.full_name);
                return (
                  <Pressable
                    onPress={() => handleSelect(s)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: pressed ? 'rgba(201,168,76,0.08)' : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {s.avatar_url ? (
                        <Image source={{ uri: s.avatar_url }} style={{ width: 32, height: 32 }} />
                      ) : (
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.textPrimary }}>
                          {initials}
                        </Text>
                      )}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                        {s.full_name ?? 'Legacy Member'}
                      </Text>
                      {s.location ? (
                        <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                          {s.location}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      )}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={(e) => setCursorPos(e.nativeEvent.selection.end)}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={style}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
    </View>
  );
}

/**
 * Parse all mention markers from raw text.
 * Returns array of { name, userId } for notification purposes.
 */
export function extractMentions(text: string): Array<{ name: string; userId: string }> {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const results: Array<{ name: string; userId: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push({ name: m[1], userId: m[2] });
  }
  return results;
}
