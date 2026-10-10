import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CameraScreen } from './src/camera/CameraScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <CameraScreen />
    </SafeAreaProvider>
  );
}
