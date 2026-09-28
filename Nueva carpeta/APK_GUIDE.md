# 📱 SynthWave - Guía de Instalación como APK

## Opción 1: Instalar como PWA (Más Fácil)

La app ya está configurada como PWA. Para instalarla en tu Android:

1. Abre la URL de la app en **Chrome para Android**
2. Toca el menú (⋮) → **"Instalar aplicación"** o **"Agregar a pantalla principal"**
3. ¡Listo! Se instala con ícono propio y funciona como app nativa

## Opción 2: Generar APK con Capacitor

### Requisitos
- Node.js 18+
- Android Studio instalado
- JDK 17+

### Pasos:

```bash
# 1. Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# 2. Inicializar Capacitor
npx cap init "SynthWave" "com.synthwave.app" --web-dir=dist

# 3. Construir la app web
npm run build

# 4. Agregar plataforma Android
npx cap add android

# 5. Copiar archivos al proyecto Android
npx cap sync android

# 6. Abrir en Android Studio
npx cap open android
```

### En Android Studio:
1. Espera a que Gradle sincronice
2. Build → Generate Signed Bundle / APK
3. Selecciona "APK"
4. Crea o usa un keystore existente
5. Selecciona "release"
6. ¡Tu APK estará en `android/app/build/outputs/apk/release/`!

## Opción 3: Generar APK con Bubblewrap (TWA)

Si la app está hosteada en un dominio con HTTPS:

```bash
# 1. Instalar Bubblewrap
npm install -g @aspect-build/bubblewrap

# 2. Inicializar
bubblewrap init --manifest=https://tu-dominio.com/manifest.json

# 3. Construir APK
bubblewrap build
```

## Opción 4: Usar PWABuilder (Sin código)

1. Ve a https://www.pwabuilder.com/
2. Ingresa la URL de tu app
3. Click en "Package for stores" → "Android"
4. Descarga el APK generado automáticamente

---

## Archivos incluidos para PWA:
- ✅ `public/manifest.json` - Manifiesto de la app
- ✅ `public/sw.js` - Service Worker (offline)
- ✅ `public/icons/icon.svg` - Ícono de la app
- ✅ Meta tags en `index.html`
