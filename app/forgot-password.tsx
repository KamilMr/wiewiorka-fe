import React, {useState} from 'react';
import {router} from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import {Text} from '@/components';

const theme = {
  background: '#fdfbf7',
  foreground: '#4a3b33',
  card: 'rgba(248, 244, 238, 0.7)',
  cardBorder: 'rgba(228, 217, 188, 0.5)',
  primary: '#b45309',
  primaryForeground: '#ffffff',
  muted: '#f1e9da',
  mutedForeground: '#78716c',
  border: '#e4d9bc',
  inputBackground: '#fdfbf7',
  successBg: 'rgba(220, 252, 231, 0.6)',
  successBorder: 'rgba(34, 197, 94, 0.3)',
  successIconBg: '#dcfce7',
  successIconColor: '#16a34a',
  decorPrimary: 'rgba(180, 83, 9, 0.08)',
  decorSecondary: 'rgba(228, 192, 144, 0.25)',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const isFormReady = emailRegex.test(email);

  const handleSubmit = async () => {
    if (!isFormReady || submitting) return;
    setSubmitting(true);
    // TODO: wire up to password reset API
    setTimeout(() => {
      setSentEmail(email);
      setSubmitting(false);
    }, 1200);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/sign-in');
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
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <FontAwesome6
              name="chevron-left"
              size={14}
              color={theme.foreground}
              iconStyle="solid"
            />
          </Pressable>
          <Text style={styles.title}>Zresetuj hasło</Text>
          <Text style={styles.subtitle}>
            Podaj adres email powiązany z Twoim kontem, a wyślemy wiadomość z
            instrukcjami resetu hasła.
          </Text>
        </View>

        {sentEmail ? (
          <View style={styles.successBanner}>
            <View style={styles.successIcon}>
              <FontAwesome6
                name="check"
                size={14}
                color={theme.successIconColor}
                iconStyle="solid"
              />
            </View>
            <View style={styles.successBody}>
              <Text style={styles.successTitle}>Sprawdź skrzynkę</Text>
              <Text style={styles.successText}>
                Wysłaliśmy link do resetu hasła na{' '}
                <Text style={styles.successEmail}>{sentEmail}</Text>
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nazwa@przyklad.pl"
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!isFormReady || submitting}
              style={({pressed}) => [
                styles.submitBtn,
                (!isFormReady || submitting) && styles.submitBtnDisabled,
                pressed && isFormReady && !submitting && styles.submitBtnPressed,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Wysyłanie...' : 'Wyślij link do resetu'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pamiętasz hasło? </Text>
          <Pressable onPress={handleBack}>
            <Text style={styles.footerLink}>Zaloguj się</Text>
          </Pressable>
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
    paddingTop: 24,
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
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4a3b33',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
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
    lineHeight: 20,
    maxWidth: 300,
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
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.successBg,
    borderWidth: 1,
    borderColor: theme.successBorder,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.successIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  successBody: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.foreground,
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    color: theme.mutedForeground,
    lineHeight: 18,
  },
  successEmail: {
    fontWeight: '600',
    color: theme.foreground,
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

export default ForgotPassword;
