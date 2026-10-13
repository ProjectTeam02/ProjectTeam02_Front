/* import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); */



// 임의 확인 코드


import { SafeAreaProvider } from 'react-native-safe-area-context';
import JobSelectionScreen from './src/screens/auth/JobSelectionScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <JobSelectionScreen previewState="mage" />
    </SafeAreaProvider>
  );
}

/* import { SafeAreaProvider } from 'react-native-safe-area-context';
import ExplorationMapScreen from './src/screens/game/ExplorationMapScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ExplorationMapScreen
        previewState="default"
        showPreviewTabBar={true}
      />
    </SafeAreaProvider>
  );
}*/
