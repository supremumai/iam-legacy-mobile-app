import { Text, View } from 'react-native';
import { Fonts } from '../../constants/fonts';

const GOLD = '#c9a84c';
const TRACK = 'rgba(201,168,76,0.18)';
const BG = '#0a0900';

// Progress ring implemented with View+borderRadius (no react-native-svg required).
// Arc effect uses the two-half clip+rotate technique; SVG can replace this in a
// future batch for a smoother gradient arc.
export default function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 7,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const deg = (p / 100) * 360;
  const halfW = size / 2;
  const inner = size - strokeWidth * 2;

  // Each rotation goes from -180° (hidden) to 0° (fully revealed)
  const rightRotate = Math.min(deg, 180) - 180;
  const leftRotate = Math.max(deg - 180, 0) - 180;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Muted background track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: halfW,
          borderWidth: strokeWidth,
          borderColor: TRACK,
        }}
      />

      {/* Right half arc — reveals 0%–50% */}
      <View
        style={{
          position: 'absolute',
          width: halfW,
          height: size,
          left: halfW,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: size,
            height: size,
            borderRadius: halfW,
            borderWidth: strokeWidth,
            borderTopColor: GOLD,
            borderRightColor: GOLD,
            borderBottomColor: TRACK,
            borderLeftColor: TRACK,
            transform: [{ rotate: `${rightRotate}deg` }],
          }}
        />
      </View>

      {/* Left half arc — reveals 50%–100% */}
      {deg > 180 && (
        <View
          style={{
            position: 'absolute',
            width: halfW,
            height: size,
            left: 0,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              width: size,
              height: size,
              borderRadius: halfW,
              borderWidth: strokeWidth,
              borderTopColor: GOLD,
              borderLeftColor: GOLD,
              borderBottomColor: TRACK,
              borderRightColor: TRACK,
              transform: [{ rotate: `${leftRotate}deg` }],
            }}
          />
        </View>
      )}

      {/* Center hole with percentage label */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: BG,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.bodyBold,
            fontSize: Math.max(11, Math.floor(inner * 0.26)),
            color: GOLD,
          }}
        >
          {p}%
        </Text>
      </View>
    </View>
  );
}
