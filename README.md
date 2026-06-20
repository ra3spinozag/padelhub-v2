# PadelHub

Aplicación móvil para la gestión integral de partidos de pádel. Permite a los jugadores encontrar, crear y administrar partidos, confirmar asistencia mediante QR, registrar resultados, valorar compañeros y seguir su evolución mediante un sistema de ranking (MMR).

Proyecto desarrollado como parte de una iniciativa académica en DuocUC.

---

## Funcionalidades principales

- **Autenticación** — Registro e inicio de sesión con RUT y contraseña
- **Partidos** — Crear, buscar y unirse a partidos por zona y formato (singles/dobles)
- **Flujo de partido** — Confirmación de presencia por QR, inicio dentro de ventana horaria, registro y confirmación de resultado entre equipos
- **Chat** — Mensajería en tiempo real por partido con identificación visual de cada jugador
- **Valoraciones** — Sistema de calificación post-partido (1–5 estrellas) entre participantes
- **Ranking** — Leaderboard con sistema MMR filtrable por zona y nivel
- **Perfil** — Estadísticas personales, historial MMR, índice Fair Play y edición de datos
- **Notificaciones** — Centro de notificaciones con preferencias configurables por tipo
- **Invitaciones** — Gestión de invitaciones a partidos
- **Matchmaking** — Sugerencia de rivales según nivel y zona

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework móvil | Expo SDK 54 / React Native 0.81 |
| Lenguaje | TypeScript |
| Navegación | expo-router v6 (file-based routing) |
| Estado global | React Context (AuthContext, PartidosContext) |
| Almacenamiento local | AsyncStorage |
| Cámara / QR | expo-camera |
| Notificaciones push | expo-notifications |
| Backend | Node.js / Express en Vercel |
| Base de datos | Supabase + Prisma ORM |
| Build | EAS Build (Expo Application Services) |

---

## Estructura del proyecto

```
app/
├── (auth)/          # Login, registro, recuperar contraseña
└── (app)/           # Pantallas protegidas
    ├── home.tsx         # Inicio: próximo partido y rivales
    ├── partidos.tsx     # Lista de partidos
    ├── crear.tsx        # Crear partido
    ├── partido/[id].tsx # Detalle y flujo completo del partido
    ├── chat/[id].tsx    # Chat del partido
    ├── valoracion/[id].tsx # Valoración post-partido
    ├── ranking.tsx      # Leaderboard MMR
    ├── perfil.tsx       # Perfil del usuario
    ├── perfil-editar.tsx
    ├── invitaciones.tsx
    ├── matchmaking.tsx
    ├── notificaciones.tsx
    └── notificaciones-preferencias.tsx

services/            # Llamadas a la API REST
context/             # AuthContext, PartidosContext
components/          # UserAvatar y otros componentes reutilizables
theme.ts             # Colores y estilos globales
```

---

## Requisitos previos

- Node.js 18+
- npm o yarn
- Expo Go (para pruebas rápidas en dispositivo) o un build de desarrollo

---

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

Desde la terminal de Expo puedes abrir la app en:
- **Android físico** — escanear el QR con Expo Go
- **Emulador Android** — presionar `a`
- **Web** — presionar `w`

---

## Generar APK para Android

El proyecto usa EAS Build para compilar en la nube sin necesitar Android Studio.

```bash
# Instalar EAS CLI (una sola vez)
npm install -g eas-cli

# Iniciar sesión con cuenta Expo
eas login

# Generar APK de prueba
eas build --platform android --profile preview
```

Al finalizar (~10–15 min) se descarga la APK directamente desde el link que entrega EAS.

> Para Play Store usar el perfil `production` que genera un `.aab`.

---

## Variables de entorno

La URL base del backend está definida en `services/api.ts`:

```
https://padelhub-backend-phi.vercel.app/api
```

No se requieren variables de entorno adicionales en el frontend para desarrollo.

---

## Backend

Repositorio separado. Expone una API REST con los siguientes grupos de endpoints:

- `/auth` — Login y registro
- `/users/:rut` — Perfil, stats, MMR, notificaciones, preferencias, foto
- `/matches` — CRUD de partidos, unirse, salir, iniciar, chat
- `/matches/:id/results` — Registro y confirmación de resultados
- `/matches/:id/ratings` — Valoraciones post-partido
- `/matches/:id/invitations` — Invitaciones a jugadores
