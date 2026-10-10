# Plan de trabajo: Cámara con álbum activo

> Nombre de trabajo provisional: **AlbumCam**

## Objetivo
App de cámara (foto y video) donde el usuario define un **álbum activo** antes de capturar. Todo lo que se captura se guarda automáticamente en ese álbum. Uso personal y profesional (inspecciones, trabajo en campo, viajes).

## Stack
- React Native + Expo (development build, no Expo Go)
- Cámara: `expo-camera` (migrable a `react-native-vision-camera`)
- Álbumes: `expo-media-library`
- Persistencia del álbum activo: `react-native-mmkv` (o `AsyncStorage`)
- Notas por foto (fase 3): `expo-sqlite`
- Builds: EAS Build

## Fase 0: Preparación (0.5 día)
- [x] Crear proyecto Expo con TypeScript
- [ ] Configurar development build (Android primero) — dependencias y plugins listos; falta generar el build
- [x] Repositorio Git y estructura de carpetas (`src/camera`, `src/albums`, `src/storage`)
- [ ] Probar la cámara básica en un dispositivo real

## Fase 1: MVP (1–2 días)
- [x] Permisos: cámara, micrófono, galería (iOS: acceso de solo agregar) — código escrito, sin probar en dispositivo; la galería pide acceso completo (hace falta leer para listar/verificar álbumes)
- [x] Captura de foto y grabación de video — código escrito, sin probar en dispositivo
- [x] Guardado en el álbum activo (crear álbum si no existe) — código escrito, sin probar en dispositivo
- [x] Chip de álbum activo en la parte superior de la cámara — código escrito, sin probar en dispositivo
- [x] Selector de álbumes (modal): listar, elegir y crear nuevo sin salir de la cámara — código escrito, sin probar en dispositivo
- [x] Recordar el último álbum usado al reabrir la app — código escrito, sin probar en dispositivo

**Criterio de éxito:** abrir la app, elegir o crear un álbum, hacer 5 fotos y 1 video, y verlos todos en ese álbum en la galería del teléfono.

## Fase 2: Modo sesión y organización (1–2 días)
- [ ] Modo sesión: el álbum se mantiene activo hasta cerrarlo
- [ ] Álbumes recientes y fijados primero
- [ ] Miniatura de la última captura con el nombre del álbum destino
- [ ] Sugerencia de álbum por fecha (opcional)

## Fase 3: Notas por captura (2–3 días)
- [ ] Tabla en SQLite: `id_archivo`, `álbum`, `nota`, `fecha`
- [ ] Nota de texto rápida después de capturar (opcional, omitible)
- [ ] Nota de voz (opcional)
- [ ] Ver y editar notas desde una vista de álbum

## Fase 4: Pulido y publicación (2–3 días)
- [ ] Pruebas en varios dispositivos Android y en iOS
- [ ] Manejo de errores: sin permisos, sin espacio, álbum eliminado
- [ ] Icono, splash y textos de permisos
- [ ] Build de producción con EAS y publicación (o APK interno)

## Riesgos y puntos a validar
| Riesgo | Mitigación |
|---|---|
| En Android, `createAlbumAsync` necesita un archivo inicial para crear el álbum | Crear el álbum al guardar la primera captura |
| Android 10+ usa almacenamiento con alcance (`Pictures/`) | Guardar siempre vía MediaStore, nunca rutas directas |
| `expo-camera` limita zoom, estabilización y frame processors | Aislar la cámara en un componente para migrar a Vision Camera |
| Álbum borrado fuera de la app | Verificar existencia antes de guardar y recrearlo |
| Rendimiento en grabación de video largo | Probar en gama baja desde la Fase 1 |

## Decisiones pendientes
1. ¿Android primero o ambas plataformas desde el inicio?
2. ¿Notas por captura desde el MVP o solo en Fase 3?
3. ¿Uso solo personal o se publicará en tiendas?
4. ¿Nombre definitivo de la app?

## Estimación total
Aprox. 7–11 días de trabajo para una versión completa; el MVP utilizable está en la Fase 1.
