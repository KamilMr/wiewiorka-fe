import React, {useState, useEffect} from 'react';
import {Link, router} from 'expo-router';
import {StyleSheet, View} from 'react-native';

import {Button, TextInput, Checkbox} from 'react-native-paper';

import {signIn} from '@/redux/auth/thunks';
import {useAppDispatch} from '@/hooks';
import {Text} from '@/components';
import {useAppTheme} from '@/constants/theme';
import {save, getValueFor, deleteValue} from '@/utils/secureStorage';

const Login = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState({email: '', password: ''});
  const [rememberUser, setRememberUser] = useState(false);

  const t = useAppTheme();

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await getValueFor('rememberedEmail');
        const savedPassword = await getValueFor('rememberedPassword');

        if (savedEmail && savedPassword) {
          setData({
            email: savedEmail,
            password: savedPassword,
          });
          setRememberUser(true);
        }
      } catch (error) {
        // No saved credentials found
      }
    };

    loadSavedCredentials();
  }, []);

  const isFormReady = data.password && data.email;

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

  const handleData = (field: string) => (text: string) => {
    setData(data => ({...data, [field]: text}));
  };

  const handleForgotPassword = () => {
    // TODO:
  };

  const handleSave = async () => {
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
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View style={{flex: 1}}></View>
      <View style={{flex: 2, width: '100%'}}>
        <Text variant="bodyLarge" style={styles.heading}>
          Logowanie do konta
        </Text>
        <TextInput
          label="Email"
          value={data.email}
          keyboardType="email-address"
          onChangeText={handleData('email')}
          style={[styles.textInput, {marginBottom: 4 * 2}]}
        />
        <TextInput
          label="Hasło"
          value={data.password}
          keyboardType="visible-password"
          onChangeText={handleData('password')}
          style={styles.textInput}
        />
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={rememberUser ? 'checked' : 'unchecked'}
            onPress={handleCheckbox}
          />
          <Text style={styles.checkboxLabel} onPress={handleCheckbox}>
            Zapamiętaj mnie
          </Text>
        </View>
      </View>
      <Button
        onPress={handleSave}
        disabled={!isFormReady}
        mode="contained"
        style={{width: '80%', marginBottom: 8 * 2}}
      >
        <Text style={{color: t.colors.white}}>Zaloguj się</Text>
      </Button>
      <View style={{flexDirection: 'row', marginBottom: 4 * 2}}>
        <Text>Nie masz konta? </Text>
        <Link href="/sign-up">
          <Text
            style={{
              color: t.colors.primary,
              textDecorationLine: 'underline',
            }}
          >
            Zarejestruj się
          </Text>
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    marginBottom: 4 * 4,
  },
  textInput: {
    marginVertical: 4 * 2,
    marginHorizontal: 4 * 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4 * 2,
    marginTop: 4 * 2,
  },
  checkboxLabel: {
    marginLeft: 4,
  },
});

export default Login;
