# 🚀 Guía de Despliegue en Vercel - Finanzas Mensuales

## ✅ Pasos para Desplegar

### 1. **Generar Iconos PWA** (Si no existen)

Los iconos deben estar en la carpeta `public/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

Puedes usar el generador incluido:
```bash
# Abrir en navegador
public/icon-generator.html
```

O usar herramientas online como:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 2. **Verificar Archivos Necesarios**

Asegúrate de que existen estos archivos:
```
finanzas-mensuales/
├── index.html           ✅
├── style.css            ✅
├── app.js               ✅
├── firebase-config.js   ✅
├── sw.js                ✅
├── manifest.json        ✅
├── vercel.json          ✅
├── css/
│   └── responsive-pwa.css  ✅
├── js/
│   ├── currency-notifications.js  ✅
│   └── integration.js  ✅
└── public/
    ├── icon-192.png     ⚠️ (generar)
    └── icon-512.png     ⚠️ (generar)
```

### 3. **Configurar Firebase** (IMPORTANTE)

Edita `firebase-config.js` con tus credenciales reales:
```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 4. **Desplegar en Vercel**

#### Opción A: Desde GitHub (Recomendado)

1. **Subir a GitHub:**
```bash
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

2. **Conectar a Vercel:**
   - Ir a https://vercel.com
   - Click en "Add New Project"
   - Importar tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración
   - Click en "Deploy"

#### Opción B: Desde CLI de Vercel

```bash
# Instalar Vercel CLI (solo la primera vez)
npm i -g vercel

# Hacer login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

### 5. **Verificar Despliegue**

Después del despliegue, verifica:

✅ **CSS carga correctamente** (la app se ve con estilos)
✅ **JavaScript funciona** (botones responden)
✅ **Service Worker se registra** (consola sin errores)
✅ **Manifest es accesible** (para PWA)
✅ **Firebase conecta** (autenticación funciona)

### 6. **Solución de Problemas Comunes**

#### ❌ Error 404 en archivos CSS/JS

**Problema:** Vercel no encuentra los archivos estáticos

**Solución:**
- Verificar que `vercel.json` tenga la configuración correcta
- Asegurarse de que las rutas en `index.html` sean relativas (sin `/` al inicio para archivos locales o con `/` para todos)

#### ❌ Service Worker falla al registrar

**Problema:** Archivos no se pueden cachear

**Solución:**
- Actualizar `sw.js` con todos los archivos necesarios
- Incrementar versión del cache: `v1.0.2`
- Borrar caché del navegador y recargar

#### ❌ Firebase no conecta

**Problema:** Credenciales incorrectas o no configuradas

**Solución:**
- Verificar `firebase-config.js` con credenciales reales
- Configurar reglas de Firestore para permitir lectura/escritura

### 7. **Configuración de Dominio Personalizado** (Opcional)

En Vercel Dashboard:
1. Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS según instrucciones

### 8. **Variables de Entorno** (Si usas APIs externas)

En Vercel Dashboard:
1. Settings → Environment Variables
2. Agregar variables necesarias
3. Redesplegar

## 🔧 Archivos Modificados para Vercel

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**",
      "use": "@vercel/static"
    }
  ]
}
```

### `.vercelignore`
```
node_modules
.git
.vscode
*.md
!README.md
```

### `sw.js` (Cache actualizado)
- Versión: `v1.0.1`
- Incluye todos los archivos CSS y JS

## 📱 Testing PWA

Después del despliegue:

1. **Chrome DevTools:**
   - Application → Service Workers (debe estar activo)
   - Application → Manifest (debe cargar correctamente)

2. **Lighthouse:**
   - Ejecutar audit PWA
   - Score debe ser > 90

3. **Instalación:**
   - En Chrome: ver botón "Instalar app"
   - En móvil: "Agregar a pantalla de inicio"

## 🎯 Checklist Final

- [ ] Iconos PWA generados (192px y 512px)
- [ ] Firebase configurado con credenciales reales
- [ ] Código subido a GitHub
- [ ] Proyecto conectado en Vercel
- [ ] Despliegue completado sin errores
- [ ] CSS carga correctamente
- [ ] JavaScript funciona
- [ ] Service Worker activo
- [ ] PWA instalable
- [ ] Pruebas en móvil realizadas

## 🆘 Soporte

Si encuentras problemas:
1. Revisar logs en Vercel Dashboard
2. Verificar consola del navegador (F12)
3. Comprobar Network tab para archivos 404
4. Verificar que todos los archivos estén en el repositorio

---

**Última actualización:** Configuración optimizada para Vercel con soporte PWA completo
