import { CameraView, type CameraType } from 'expo-camera';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';

export type CaptureMode = 'picture' | 'video';

export type CaptureResult = { uri: string; type: 'photo' | 'video' };

export type CaptureCameraHandle = {
  takePhoto: () => Promise<CaptureResult | null>;
  startRecording: () => Promise<CaptureResult | null>;
  stopRecording: () => void;
};

type Props = {
  mode: CaptureMode;
  facing: CameraType;
};

/**
 * Único punto de contacto con expo-camera. Si se migra a
 * react-native-vision-camera, solo cambia este archivo.
 */
export const CaptureCamera = forwardRef<CaptureCameraHandle, Props>(({ mode, facing }, ref) => {
  const camera = useRef<CameraView>(null);

  useImperativeHandle(ref, () => ({
    async takePhoto() {
      const photo = await camera.current?.takePictureAsync({ quality: 0.9 });
      return photo ? { uri: photo.uri, type: 'photo' } : null;
    },
    async startRecording() {
      const video = await camera.current?.recordAsync();
      return video ? { uri: video.uri, type: 'video' } : null;
    },
    stopRecording() {
      camera.current?.stopRecording();
    },
  }));

  return <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} mode={mode} />;
});

CaptureCamera.displayName = 'CaptureCamera';
