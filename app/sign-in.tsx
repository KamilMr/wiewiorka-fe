import React, {useState, useEffect} from 'react';
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

import {signIn} from '@/redux/auth/thunks';
import {useAppDispatch} from '@/hooks';
import {Text} from '@/components';
import {save, getValueFor, deleteValue} from '@/utils/secureStorage';

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
  border: '#e4d9bc',
  inputBackground: '#fdfbf7',
  decorPrimary: 'rgba(180, 83, 9, 0.08)',
  decorSecondary: 'rgba(228, 192, 144, 0.25)',
};

const Login = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState({
    email: process.env.EXPO_PUBLIC_USER_EMAIL || '',
    password: process.env.EXPO_PUBLIC_USER_PASSWORD || '',
  });
  const [rememberUser, setRememberUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await getValueFor('rememberedEmail');
        const savedPassword = await getValueFor('rememberedPassword');

        if (savedEmail && savedPassword) {
          setData({email: savedEmail, password: savedPassword});
          setRememberUser(true);
        }
      } catch (error) {
        // No saved credentials found
      }
    };

    loadSavedCredentials();
  }, []);

  const isFormReady = !!(data.password && data.email);

  const handleCheckbox = async () => {
    const newRememberValue = !rememberUser;
    setRememberUser(newRememberValue);

    if (!newRememberValue) {
      try {
        await deleteValue('rememberedEmail');
        await deleteValue('rememberedPassword');
      } catch (error) {
        // Error clearing saved credentials
      }
    }
  };

  const handleData = (field: 'email' | 'password') => (text: string) => {
    setData(d => ({...d, [field]: text}));
  };

  const handleSave = async () => {
    if (!isFormReady) return;
    try {
      await dispatch(signIn(data)).unwrap();

      if (rememberUser) {
        await save('rememberedEmail', data.email);
        await save('rememberedPassword', data.password);
      }

      router.replace('/');
    } catch (error: any) {
      // Handle login error
    }
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
              size={28}
              color={theme.primaryForeground}
              iconStyle="solid"
            />
          </View>
          <Text style={styles.title}>Wiewiórka</Text>
          <Text style={styles.subtitle}>
            Witaj ponownie. Zaloguj się, aby zarządzać swoimi finansami.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrap,
                focused === 'email' && styles.inputWrapFocused,
              ]}
            >
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
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Hasło</Text>
              <Pressable onPress={() => {}}>
                <Text style={styles.forgotLink}>Nie pamiętasz hasła?</Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.inputWrap,
                focused === 'password' && styles.inputWrapFocused,
              ]}
            >
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
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
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
          </View>

          <View style={styles.rememberRow}>
            <Checkbox
              status={rememberUser ? 'checked' : 'unchecked'}
              onPress={handleCheckbox}
              color={theme.primary}
              uncheckedColor={theme.mutedForeground}
            />
            <Pressable onPress={handleCheckbox}>
              <Text style={styles.rememberLabel}>Zapamiętaj mnie</Text>
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
            <Text style={styles.submitBtnText}>Zaloguj się</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nie masz konta? </Text>
          <Link href="/sign-up">
            <Text style={styles.footerLink}>Zarejestruj się</Text>
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
    paddingTop: 40,
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
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    fontSize: 15,
    color: theme.mutedForeground,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
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
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.foreground,
    marginBottom: 8,
    marginLeft: 4,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 0,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapFocused: {
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 0},
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  rememberLabel: {
    fontSize: 14,
    color: theme.foreground,
    marginLeft: 4,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
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
    marginTop: 32,
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

export default Login;
