import { useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlbumPickerModal } from '../albums/AlbumPickerModal';
import { ensureMediaPermission, saveToAlbum } from '../albums/albumService';
import { getActiveAlbum, setActiveAlbum } from '../storage/activeAlbum';
import {
  CaptureCamera,
  type CaptureCameraHandle,
  type CaptureMode,
  type CaptureResult,
} from './CaptureCamera';

export function CameraScreen() {
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [mediaGranted, setMediaGranted] = useState<boolean | null>(null);

  const [album, setAlbum] = useState<string | null>(() => getActiveAlbum());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const camera = useRef<CaptureCameraHandle>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    ensureMediaPermission().then(setMediaGranted);
  }, []);

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  const flash = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  }, []);

  const selectAlbum = useCallback((name: string) => {
    setActiveAlbum(name);
    setAlbum(name);
    setPickerOpen(false);
  }, []);

  const persist = useCallback(
    async (result: CaptureResult | null) => {
      if (!result || !album) return;
      try {
        const { created } = await saveToAlbum(result.uri, album);
        flash(
          `${result.type === 'photo' ? 'Foto' : 'Video'} guardado en «${album}»${
            created ? ' (álbum creado)' : ''
          }`,
        );
      } catch {
        flash('No se pudo guardar. Revisa el espacio y los permisos.');
      }
    },
    [album, flash],
  );

  const onShutter = useCallback(async () => {
    if (!album) {
      setPickerOpen(true);
      return;
    }
    if (busy) return;

    if (mode === 'video') {
      if (recording) {
        camera.current?.stopRecording();
        return;
      }
      if (!micPerm?.granted && !(await requestMicPerm()).granted) {
        flash('Se necesita el micrófono para grabar video.');
        return;
      }
      setRecording(true);
      try {
        // recordAsync se resuelve cuando se llama a stopRecording.
        await persist(await camera.current!.startRecording());
      } catch {
        flash('Error al grabar el video.');
      } finally {
        setRecording(false);
      }
      return;
    }

    setBusy(true);
    try {
      await persist(await camera.current!.takePhoto());
    } catch {
      flash('Error al tomar la foto.');
    } finally {
      setBusy(false);
    }
  }, [album, busy, mode, recording, micPerm, requestMicPerm, persist, flash]);

  if (!camPerm || mediaGranted === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!camPerm.granted || !mediaGranted) {
    const cameraMissing = !camPerm.granted;
    const canAsk = cameraMissing ? camPerm.canAskAgain : true;
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          AlbumCam necesita acceso a la {cameraMissing ? 'cámara' : 'galería'} para funcionar.
        </Text>
        <Pressable
          style={styles.permBtn}
          onPress={async () => {
            if (!canAsk) return Linking.openSettings();
            if (cameraMissing) await requestCamPerm();
            else setMediaGranted(await ensureMediaPermission());
          }}
        >
          <Text style={styles.permBtnText}>{canAsk ? 'Conceder permiso' : 'Abrir ajustes'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CaptureCamera ref={camera} mode={mode} facing={facing} />

      <SafeAreaView style={styles.top} pointerEvents="box-none">
        <Pressable
          style={styles.chip}
          onPress={() => !recording && setPickerOpen(true)}
          accessibilityLabel="Cambiar álbum activo"
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {album ? `📁 ${album}` : '📁 Elegir álbum'}
          </Text>
        </Pressable>
      </SafeAreaView>

      {message && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{message}</Text>
        </View>
      )}

      <SafeAreaView style={styles.bottom} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.modes}>
          {(['picture', 'video'] as const).map((m) => (
            <Pressable key={m} disabled={recording} onPress={() => setMode(m)}>
              <Text style={[styles.modeText, mode === m && styles.modeActive]}>
                {m === 'picture' ? 'FOTO' : 'VIDEO'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.side} />
          <Pressable
            onPress={onShutter}
            disabled={busy}
            accessibilityLabel={mode === 'picture' ? 'Tomar foto' : recording ? 'Detener' : 'Grabar'}
            style={[styles.shutterOuter, busy && styles.disabled]}
          >
            <View
              style={[
                styles.shutterInner,
                mode === 'video' && styles.shutterVideo,
                recording && styles.shutterRecording,
              ]}
            />
          </Pressable>
          <Pressable
            style={styles.side}
            disabled={recording}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            accessibilityLabel="Cambiar cámara"
          >
            <Text style={styles.flip}>🔄</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <AlbumPickerModal
        visible={pickerOpen}
        activeAlbum={album}
        onSelect={selectAlbum}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  permBtn: { backgroundColor: '#0a84ff', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '600' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 8 },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  chipText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  toast: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  toastText: { color: '#fff', textAlign: 'center' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 16 },
  modes: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: 16 },
  modeText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 1 },
  modeActive: { color: '#ffd60a' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  side: { width: 56, alignItems: 'center' },
  flip: { fontSize: 28 },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  shutterVideo: { backgroundColor: '#ff453a' },
  shutterRecording: { width: 30, height: 30, borderRadius: 6 },
  disabled: { opacity: 0.5 },
});
