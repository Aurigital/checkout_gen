# Paylink - Generador de Links de Pago

Aplicación PWA para generar links de pago con **ONVO** y **TiloPay** (Costa Rica).

## 🚀 Features

- ✅ **Autenticación con contraseña única** (httpOnly cookie + Edge middleware)
- ✅ **Integración ONVO** — Pagos únicos y suscripciones
- ⏳ **Integración TiloPay** — Pendiente (ver [TILOPAY_RESEARCH.md](./TILOPAY_RESEARCH.md))
- ✅ **PWA instalable** — Funciona como app nativa en móviles ([Guía de instalación](./PWA_INSTALL_GUIDE.md))
- ✅ **UI mobile-first** — Diseño optimizado para dispositivos móviles
- ✅ **Toast notifications** — Feedback visual con auto-dismiss
- ✅ **Copy to clipboard** — Compatible con iOS Safari

## 📦 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **next-pwa** — Progressive Web App
- **Web Crypto API** — SHA-256 hashing para auth

## 🛠️ Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y configurá las credenciales:

```bash
cp .env.example .env.local
```

**Variables requeridas:**

```env
# ONVO (funciona)
NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY=onvo_live_publishable_key_...
ONVO_SECRET_KEY=onvo_live_secret_key_...

# TiloPay (pendiente - ver TILOPAY_RESEARCH.md)
NEXT_PUBLIC_TILOPAY_PUBLIC_KEY=1206-6665-8400-2625-9049
TILOPAY_API_USER=LkMQ7S
TILOPAY_SECRET_KEY=ftvD82
TILOPAY_BASE_URL=https://app.tilopay.com/api/v1

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_PASSWORD=tu_contraseña_segura
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

**Credenciales default:**
- Password: `password` (configurado en `AUTH_PASSWORD`)

## 🚢 Deploy en Vercel

### Opción 1: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en el dashboard de Vercel
# https://vercel.com/tu-usuario/checkout-gen/settings/environment-variables

# Deploy a producción
vercel --prod
```

### Opción 2: Deploy desde Git

1. Pusheá el repo a GitHub:
   ```bash
   git remote add origin https://github.com/tu-usuario/checkout-gen.git
   git push -u origin main
   ```

2. Importá el proyecto en [vercel.com](https://vercel.com/new)

3. Configurá las variables de entorno en el dashboard

4. Deploy automático en cada push a `main`

## 📝 Variables de Entorno en Vercel

En el dashboard de Vercel, agregá estas variables:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY` | `onvo_live_publishable_key_...` |
| `ONVO_SECRET_KEY` | `onvo_live_secret_key_...` |
| `NEXT_PUBLIC_TILOPAY_PUBLIC_KEY` | `1206-6665-8400-2625-9049` |
| `TILOPAY_API_USER` | `LkMQ7S` |
| `TILOPAY_SECRET_KEY` | `ftvD82` |
| `TILOPAY_BASE_URL` | `https://app.tilopay.com/api/v1` |
| `NEXT_PUBLIC_BASE_URL` | `https://tu-dominio.vercel.app` |
| `AUTH_PASSWORD` | `tu_contraseña_segura_produccion` |

## 🔒 Seguridad

- Las API keys **nunca** se exponen al cliente
- Autenticación con httpOnly cookies (inmune a XSS)
- Middleware en Edge runtime protege todas las rutas
- Token = SHA-256(AUTH_PASSWORD) — sin base de datos

## 📂 Estructura del Proyecto

```
checkout-gen/
├── app/
│   ├── api/
│   │   ├── auth/          # Login/logout endpoints
│   │   └── generate/      # Generación de links (ONVO/TiloPay)
│   ├── login/             # Página de login
│   ├── success/           # Página de éxito post-pago
│   ├── cancel/            # Página de cancelación
│   └── page.tsx           # Formulario principal
├── lib/
│   ├── auth.ts            # Utilidades de autenticación
│   ├── config.ts          # Validación de env vars
│   ├── onvo.ts            # Cliente API ONVO
│   └── tilopay.ts         # Cliente API TiloPay (no funcional)
├── middleware.ts          # Auth middleware (Edge)
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png       # App icon 192x192
│   └── icon-512.png       # App icon 512x512
└── TILOPAY_RESEARCH.md    # Investigación TiloPay
```

## ⚠️ Estado de las Integraciones

### ✅ ONVO — Funcional
- Pagos únicos: ✅
- Suscripciones: ✅
- Redirect flow completo: ✅

### ✅ TiloPay — Link de Pago Abierto
**Status:** Funcional con link de pago pre-creado.

**Cómo funciona:**
1. Usuario llena el formulario y selecciona TiloPay
2. Click en "Generar" → abre `https://tp.cr/s/MTExODk1` en nueva pestaña
3. Link se copia automáticamente al portapapeles
4. Cliente puede usar este link universal para todos los pagos

**Nota:** Se utiliza un "link de pago abierto" único creado desde el admin de TiloPay. Este link acepta cualquier monto que ingrese el cliente.

**Estado de API:**
TiloPay no provee un API público para generar links de pago programáticamente. Ver detalles en [TILOPAY_RESEARCH.md](./TILOPAY_RESEARCH.md).

## 🐛 Troubleshooting

### Error: "AUTH_PASSWORD is not set"
→ Asegurate de que `.env.local` existe y tiene `AUTH_PASSWORD=tu_contraseña`

### Error: "Network error contacting TiloPay"
→ TiloPay no está funcionando. Ver [TILOPAY_RESEARCH.md](./TILOPAY_RESEARCH.md)

### PWA no se instala en móvil
→ Debe estar en HTTPS. En local, PWA solo funciona en `localhost`. En producción, Vercel provee HTTPS automáticamente.

### El link no se copia al portapapeles en iOS
→ El fix ya está implementado usando `document.execCommand('copy')`. Asegurate de tener la última versión deployada en Vercel.

## 📱 Usar como PWA (App Instalable)

Esta app está optimizada para funcionar como Progressive Web App (PWA). Podés instalarla en tu dispositivo y usarla como una app nativa.

### iOS (iPhone/iPad)
Ver la guía completa paso a paso: **[PWA_INSTALL_GUIDE.md](./PWA_INSTALL_GUIDE.md)**

**Resumen rápido:**
1. Abrí la app en **Safari** (no Chrome)
2. Tocá el botón **Compartir** (cuadrado con flecha)
3. Seleccioná **"Agregar a inicio"**
4. Confirmá y listo — el ícono aparecerá en tu pantalla de inicio

**Beneficios:**
- ✅ Abre en pantalla completa (sin barra de Safari)
- ✅ Funciona como app nativa
- ✅ Más rápido (caché local)
- ✅ Ícono en la pantalla de inicio

### Android
1. Abrí la app en Chrome
2. Tocá el menú (⋮) → **"Agregar a pantalla de inicio"** o **"Instalar app"**
3. Confirmá

## 📄 License

MIT

---

Desarrollado con [Claude Code](https://claude.com/claude-code)
