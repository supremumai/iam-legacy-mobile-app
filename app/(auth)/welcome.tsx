import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Logo / Brand */}
        <View style={styles.brandArea}>
          <Image
            source={require('../../assets/legacy-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Build Your Legacy</Text>
          <Text style={styles.subtitle}>
            Join a community of serious investors, entrepreneurs and leaders.
          </Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.75}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  brandArea: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  logo: {
    width: 160,
    height: 60,
  },
  tagline: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  buttonArea: {
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
