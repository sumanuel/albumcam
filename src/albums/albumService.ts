import * as MediaLibrary from 'expo-media-library';

export type SaveResult = { created: boolean };

export function normalizeAlbumName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export async function ensureMediaPermission(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync();
  if (current.granted) return true;
  const next = await MediaLibrary.requestPermissionsAsync();
  return next.granted;
}

export async function listAlbumNames(): Promise<string[]> {
  const albums = await MediaLibrary.Album.getAll();
  const names = await Promise.all(albums.map((a) => a.getTitle()));
  return names
    .filter((n) => n.length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Guarda un archivo capturado en el álbum indicado.
 * El álbum se busca en cada guardado: si fue eliminado fuera de la app
 * (o aún no existe) se crea con esta captura, que en Android es la única
 * forma de crear un álbum.
 */
export async function saveToAlbum(fileUri: string, albumName: string): Promise<SaveResult> {
  const album = await MediaLibrary.Album.get(albumName);
  if (album) {
    await MediaLibrary.Asset.create(fileUri, album);
    return { created: false };
  }
  await MediaLibrary.Album.create(albumName, [fileUri]);
  return { created: true };
}
