import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { listAlbumNames, normalizeAlbumName } from './albumService';

type Props = {
  visible: boolean;
  activeAlbum: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
};

export function AlbumPickerModal({ visible, activeAlbum, onSelect, onClose }: Props) {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNewName('');
    listAlbumNames()
      .then((names) => !cancelled && setAlbums(names))
      .catch(() => !cancelled && setError('No se pudieron cargar los álbumes.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const cleanName = normalizeAlbumName(newName);
  const nameTaken = albums.some((a) => a.toLowerCase() === cleanName.toLowerCase());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Álbum activo</Text>

          <View style={styles.newRow}>
            <TextInput
              style={styles.input}
              placeholder="Nuevo álbum…"
              placeholderTextColor="#888"
              value={newName}
              onChangeText={setNewName}
              maxLength={60}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.createBtn, !cleanName && styles.disabled]}
              disabled={!cleanName}
              onPress={() => onSelect(cleanName)}
            >
              <Text style={styles.createText}>{nameTaken ? 'Usar' : 'Crear'}</Text>
            </Pressable>
          </View>

          {loading && <ActivityIndicator style={styles.pad} color="#fff" />}
          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={albums}
            keyExtractor={(name) => name}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading && !error ? <Text style={styles.empty}>No hay álbumes todavía.</Text> : null
            }
            renderItem={({ item }) => (
              <Pressable style={styles.item} onPress={() => onSelect(item)}>
                <Text style={styles.itemText}>{item}</Text>
                {item === activeAlbum && <Text style={styles.check}>●</Text>}
              </Pressable>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  newRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createBtn: {
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  createText: { color: '#fff', fontWeight: '600' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3c',
  },
  itemText: { color: '#fff', fontSize: 16 },
  check: { color: '#0a84ff', fontSize: 16 },
  pad: { padding: 16 },
  empty: { color: '#888', padding: 16, textAlign: 'center' },
  error: { color: '#ff453a', padding: 8 },
});
