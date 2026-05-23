import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type FocusedField = 'fullName' | 'username' | 'email' | 'password' | 'confirmPassword' | null;

export default function SignUpScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [focused, setFocused] = useState<FocusedField>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fieldBorder = (field: FocusedField) =>
    focused === field ? '#c9a84c' : 'rgba(201,168,76,0.22)';

  async function handleSignUp() {
    setError('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username.trim(),
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Legacy community</Text>

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Check your email to confirm your account
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Full Name */}
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('fullName') }]}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocused('fullName')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Username */}
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('username') }]}
                placeholder="Choose a username"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('email') }]}
                placeholder="Email Address"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('password') }]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="next"
              />

              {/* Confirm Password */}
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('confirmPassword') }]}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />

              {/* Error */}
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {/* Submit */}
              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.85}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0a0900" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Footer link */}
              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text style={styles.footerLinkText}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0900',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backArrow: {
    fontSize: 24,
    color: 'white',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: '#c9a84c',
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1c1a14',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: 'white',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#e05c5c',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#c9a84c',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#0a0900',
  },
  footerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  footerLinkText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#c9a84c',
  },
  successContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#c9a84c',
    textAlign: 'center',
    lineHeight: 26,
  },
});
