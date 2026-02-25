# Guía de Instalación PWA - Paylink

## 📱 Instalar en iPhone/iPad (iOS Safari)

### Paso 1: Abrir en Safari
1. Abrí **Safari** en tu iPhone/iPad
2. Navegá a la URL de la aplicación (ej: `https://checkout-gen.vercel.app`)
3. Iniciá sesión con tu contraseña

### Paso 2: Agregar a la Pantalla de Inicio
1. Tocá el botón **Compartir** (ícono de cuadrado con flecha hacia arriba) en la barra inferior
2. Scrolleá hacia abajo en el menú que aparece
3. Tocá **"Agregar a inicio"** o **"Add to Home Screen"**

   ![Share button location](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios15-safari-share-button.png)

4. Editá el nombre si querés (ej: "Paylink")
5. Tocá **"Agregar"** en la esquina superior derecha

### Paso 3: Usar la App
1. Volvé a la pantalla de inicio de tu iPhone
2. Verás el ícono de Paylink (azul con símbolo de link)
3. Tocá el ícono para abrir la app **en modo standalone** (sin la barra de Safari)

---

## 🔄 Diferencias entre PWA y Web Normal

### ✅ Cuando usás el ícono del PWA:
- ✅ Abre en pantalla completa (sin barra de dirección de Safari)
- ✅ Funciona como una app nativa
- ✅ Más rápido (archivos en caché)
- ✅ Puede funcionar offline (páginas ya visitadas)
- ✅ Ícono en la pantalla de inicio

### ❌ Si abrís desde Safari normalmente:
- Tenés la barra de dirección arriba
- Menos espacio de pantalla
- No se guarda en caché tan eficientemente

---

## 🍏 Cómo identificar que estás en modo PWA

Cuando abrís la app desde el ícono:
- **NO verás** la barra de dirección de Safari
- **NO verás** los botones de navegación (atrás/adelante)
- Verás solo el contenido de la app en pantalla completa
- La barra de estado (hora, batería) estará visible

---

## 🔧 Troubleshooting

### No veo la opción "Agregar a inicio"
- ✅ Asegurate de estar usando **Safari** (no Chrome/Firefox)
- ✅ Verificá que estés en la página principal, no en una subpágina
- ✅ Intentá recargar la página (Pull to refresh)

### El ícono no aparece en la pantalla de inicio
- Esperá unos segundos, a veces tarda en aparecer
- Buscá en otras páginas de la pantalla de inicio
- Reiniciá el dispositivo

### La app se abre en Safari normal
- Asegurate de tocar el **ícono en la pantalla de inicio**, no un bookmark de Safari
- Si agregaste un bookmark en Safari, eliminalo y usá "Agregar a inicio" en su lugar

### Necesito actualizar la app
- La PWA se actualiza automáticamente cuando hay cambios
- Si ves contenido viejo, cerrá completamente la app (deslizá hacia arriba desde el dock)
- Volvé a abrir desde el ícono

---

## 🗑️ Desinstalar el PWA

1. Mantené presionado el ícono de Paylink en la pantalla de inicio
2. Tocá **"Eliminar App"** o **"Remove App"**
3. Confirmá **"Eliminar de inicio"** (no afecta tu cuenta web)

---

## 📊 Beneficios del PWA

- 🚀 **Más rápido**: Archivos en caché local
- 📱 **Como app nativa**: Sin barra de navegador
- 💾 **Ahorra datos**: Solo descarga cambios nuevos
- 🔒 **Seguro**: Mismo nivel de seguridad que la web
- ⚡ **Offline parcial**: Páginas visitadas quedan guardadas

---

## ❓ Preguntas Frecuentes

**¿Necesito descargar algo de la App Store?**
No. Es una Progressive Web App (PWA), se instala directamente desde Safari.

**¿Ocupa mucho espacio?**
No. Solo unos pocos MB (mucho menos que una app nativa).

**¿Funciona sin internet?**
Parcialmente. Las páginas ya visitadas se pueden ver, pero para generar links nuevos necesitás conexión.

**¿Se actualiza automáticamente?**
Sí. Cada vez que abrís la app, verifica si hay actualizaciones y las descarga en segundo plano.

**¿Puedo tenerla en iPad también?**
Sí, el proceso es exactamente el mismo.

---

**Nota:** Esta guía asume iOS 14 o superior. En versiones anteriores, la opción puede estar en una ubicación ligeramente diferente.
