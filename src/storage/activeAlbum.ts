import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'albumcam' });

const ACTIVE_ALBUM_KEY = 'activeAlbum';

export function getActiveAlbum(): string | null {
  return storage.getString(ACTIVE_ALBUM_KEY) ?? null;
}

export function setActiveAlbum(name: string): void {
  storage.set(ACTIVE_ALBUM_KEY, name);
}
