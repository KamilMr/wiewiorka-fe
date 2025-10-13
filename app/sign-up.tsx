import {useState} from 'react';
import {router, Link} from 'expo-router';
import {StyleSheet, View} from 'react-native';

import {Button, TextInput} from 'react-native-paper';

import {signIn, signup} from '@/redux/auth/thunks';
import {useAppDispatch} from '@/hooks';
import {Text} from '@/components';
import {useAppTheme} from '@/constants/theme';

interface SignupData {
  email: string;
  password: string;
  name: string;
  surname?: string;
}

const Signup = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    surname: '',
  });

  const t = useAppTheme();

  const isFormReady = data.password && data.email;

  const handleData = (field: string) => (text: string) => {
    setData(data => ({...data, [field]: text}));
  };

  const handleSave = () => {
    dispatch(signup(data))
      .unwrap()
      .then(() => router.replace('/sign-in'))
      .catch(err => {});
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View style={{flex: 1}}></View>
      <View style={{flex: 2, width: '100%'}}>
        <Text variant="bodyLarge" style={styles.heading}>
          Rejestracja konta
        </Text>
        <TextInput
          label="Imię"
          value={data.name}
          onChangeText={handleData('name')}
          style={[styles.textInput, {marginBottom: 4 * 2}]}
        />
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
      </View>
      <Button
        onPress={handleSave}
        disabled={!isFormReady}
        mode="contained"
        style={{width: '80%', marginBottom: 8 * 2}}
      >
        Zarejestruj się
      </Button>
      <View style={{flexDirection: 'row', marginBottom: 4 * 2}}>
        <Text>Masz konto? </Text>
        <Link href="/sign-in">
          <Text
            style={{
              color: t.colors.primary,
              textDecorationLine: 'underline',
            }}
          >
            Zaloguj się
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
});

export default Signup;
