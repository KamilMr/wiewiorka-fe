import {Text, TouchableOpacity} from 'react-native';
import {router} from 'expo-router';

const packageJson = require('../package.json');

export default function AppVersion() {
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/changelog')}
      style={{alignSelf: 'flex-start', marginLeft: 16, marginTop: 16, padding: 8}}
    >
      <Text style={{fontSize: 12, color: '#666'}}>
        v{packageJson.version}
      </Text>
    </TouchableOpacity>
  );
}
