/**
 * MentionText
 *
 * Renders raw text that may contain mention markers of the form
 * `@[Full Name](user_id)`. Mentions are rendered as gold, tappable
 * inline text that navigates to the mentioned user's profile.
 */
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

interface Props {
  text: string;
  style?: object;
  numberOfLines?: number;
}

// Split raw text into segments: plain strings and mention objects.
interface PlainSegment { kind: 'plain'; text: string }
interface MentionSegment { kind: 'mention'; name: string; userId: string }
type Segment = PlainSegment | MentionSegment;

function parseSegments(text: string): Segment[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: 'plain', text: text.slice(lastIndex, m.index) });
    }
    segments.push({ kind: 'mention', name: m[1], userId: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'plain', text: text.slice(lastIndex) });
  }
  return segments;
}

export default function MentionText({ text, style, numberOfLines }: Props) {
  const router = useRouter();
  const colors = useColors();
  const segments = parseSegments(text);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) => {
        if (seg.kind === 'plain') {
          return <Text key={i}>{seg.text}</Text>;
        }
        return (
          <Text
            key={i}
            style={{ fontFamily: Fonts.bodySemiBold, color: colors.gold }}
            onPress={() => router.push(`/profile?id=${seg.userId}` as any)}
          >
            @{seg.name}
          </Text>
        );
      })}
    </Text>
  );
}
