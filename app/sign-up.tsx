import React, {useState} from 'react';
import {Link, router} from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Checkbox} from 'react-native-paper';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import {signup} from '@/redux/auth/thunks';
import {useAppDispatch} from '@/hooks';
import {Text} from '@/components';

const theme = {
  background: '#fdfbf7',
  foreground: '#4a3b33',
  card: 'rgba(248, 244, 238, 0.7)',
  cardBorder: 'rgba(228, 217, 188, 0.5)',
  primary: '#b45309',
  primaryForeground: '#ffffff',
  secondary: '#e4c090',
  muted: '#f1e9da',
  mutedForeground: '#78716c',
  destructive: '#991b1b',
  border: '#e4d9bc',
  inputBackground: '#fdfbf7',
  decorPrimary: 'rgba(180, 83, 9, 0.08)',
  decorSecondary: 'rgba(228, 192, 144, 0.25)',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Strength = 'weak' | 'fair' | 'strong' | null;

const getStrength = (pwd: string): Strength => {
  if (!pwd) return null;
  if (pwd.length < 6) return 'weak';
  if (pwd.length < 10) return 'fair';
  return 'strong';
};

const strengthMeta: Record<
  Exclude<Strength, null>,
  {label: string; color: string; segments: number}
> = {
  weak: {label: 'Słabe hasło', color: theme.destructive, segments: 1},
  fair: {label: 'Średnie hasło', color: theme.secondary, segments: 2},
  strong: {label: 'Silne hasło', color: theme.primary, segments: 3},
};

const Signup = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getStrength(data.password);

  const isFormReady =
    data.name.trim().length >= 2 &&
    emailRegex.test(data.email) &&
    data.password.length >= 6 &&
    terms;

  const handleData = (field: 'name' | 'email' | 'password') => (text: string) => {
    setData(d => ({...d, [field]: text}));
  };

  const handleSave = () => {
    if (!isFormReady) return;
    dispatch(signup(data))
      .unwrap()
      .then(() => router.replace('/sign-in'))
      .catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.decorTopLeft} pointerEvents="none" />
      <View style={styles.decorBottomRight} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <FontAwesome6
              name="leaf"
              size={24}
              color={theme.primaryForeground}
              iconStyle="solid"
            />
          </View>
          <Text style={styles.title}>Utwórz konto</Text>
          <Text style={styles.subtitle}>
            Dołącz do Wiewiórki i przejmij kontrolę nad swoimi finansami.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Imię i nazwisko</Text>
            <View style={styles.inputWrap}>
              <FontAwesome6
                name="user"
                size={16}
                color={theme.mutedForeground}
                iconStyle="regular"
                style={styles.inputIconLeft}
              />
              <RNTextInput
                value={data.name}
                onChangeText={handleData('name')}
                placeholder="Jan Kowalski"
                placeholderTextColor={theme.mutedForeground}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <FontAwesome6
                name="envelope"
                size={16}
                color={theme.mutedForeground}
                iconStyle="regular"
                style={styles.inputIconLeft}
              />
              <RNTextInput
                value={data.email}
                onChangeText={handleData('email')}
                placeholder="nazwa@przyklad.pl"
                placeholderTextColor={theme.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Hasło</Text>
            <View style={styles.inputWrap}>
              <FontAwesome6
                name="lock"
                size={16}
                color={theme.mutedForeground}
                iconStyle="solid"
                style={styles.inputIconLeft}
              />
              <RNTextInput
                value={data.password}
                onChangeText={handleData('password')}
                placeholder="••••••••"
                placeholderTextColor={theme.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, {paddingRight: 44}]}
              />
              <Pressable
                onPress={() => setShowPassword(p => !p)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <FontAwesome6
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={16}
                  color={theme.mutedForeground}
                  iconStyle="regular"
                />
              </Pressable>
            </View>

            {strength && (
              <View style={styles.meterContainer}>
                <View style={styles.meterBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.meterSegment,
                        i <= strengthMeta[strength].segments && {
                          backgroundColor: strengthMeta[strength].color,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.meterLabelRow}>
                  <FontAwesome6
                    name="circle-info"
                    size={10}
                    color={strengthMeta[strength].color}
                    iconStyle="solid"
                  />
                  <Text
                    style={[
                      styles.meterText,
                      {color: strengthMeta[strength].color},
                    ]}
                  >
                    {strengthMeta[strength].label}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.termsRow}>
            <Checkbox
              status={terms ? 'checked' : 'unchecked'}
              onPress={() => setTerms(t => !t)}
              color={theme.primary}
              uncheckedColor={theme.mutedForeground}
            />
            <Pressable
              onPress={() => setTerms(t => !t)}
              style={styles.termsLabelWrap}
            >
              <Text style={styles.termsText}>
                Akceptuję{' '}
                <Text style={styles.termsLink}>Regulamin</Text> oraz{' '}
                <Text style={styles.termsLink}>Politykę prywatności</Text>
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!isFormReady}
            style={({pressed}) => [
              styles.submitBtn,
              !isFormReady && styles.submitBtnDisabled,
              pressed && isFormReady && styles.submitBtnPressed,
            ]}
          >
            <Text style={styles.submitBtnText}>Utwórz konto</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Masz już konto? </Text>
          <Link href="/sign-in">
            <Text style={styles.footerLink}>Zaloguj się</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  decorTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.decorSecondary,
  },
  decorBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.decorPrimary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.foreground,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.mutedForeground,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
    shadowColor: '#4a3b33',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 12,
    elevation: 3,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.foreground,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.foreground,
    paddingVertical: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  meterContainer: {
    marginTop: 8,
  },
  meterBars: {
    flexDirection: 'row',
    gap: 4,
  },
  meterSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  meterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  meterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
  },
  termsLabelWrap: {
    flex: 1,
    paddingTop: 8,
  },
  termsText: {
    fontSize: 12,
    color: theme.mutedForeground,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.primary,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: theme.primary,
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnText: {
    color: theme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: theme.mutedForeground,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    textDecorationLine: 'underline',
  },
});

export default Signup;
