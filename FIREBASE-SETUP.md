# 🔥 Configuración de Firebase

## ✅ Pasos Completados

1. ✅ Firebase instalado (`npm install firebase`)
2. ✅ Credenciales configuradas en `firebase-config.js`
3. ✅ Código integrado en la aplicación

---

## 📋 Pasos Pendientes en Firebase Console

### 1. Activar Authentication (Autenticación Anónima)

1. Ve a [Firebase Console](https://console.firebase.google.com/project/aplicacion-gastos-temporal)
2. En el menú lateral, haz clic en **"Authentication"** (Autenticación)
3. Haz clic en **"Comenzar"** (Get Started)
4. Ve a la pestaña **"Sign-in method"**
5. Haz clic en **"Anónimo"** (Anonymous)
6. **Activa** el toggle para habilitarlo
7. Haz clic en **"Guardar"**

✅ **Esto permite que los usuarios se conecten sin necesidad de email/password**

---

### 2. Crear Firestore Database

1. En el menú lateral, haz clic en **"Firestore Database"**
2. Haz clic en **"Crear base de datos"** (Create database)
3. Selecciona **"Iniciar en modo de prueba"** (Start in test mode)
   - Esto permite lectura/escritura por 30 días sin reglas
4. Selecciona ubicación: **"us-central"** (o la más cercana)
5. Haz clic en **"Habilitar"** (Enable)

---

### 3. Configurar Reglas de Firestore (IMPORTANTE)

**Opción A: Desde Firebase Console (Manual)**

1. Ve a **Firestore Database** → pestaña **"Reglas"** (Rules)
2. Reemplaza el contenido con estas reglas:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo puede ver/editar sus propios datos
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Bloquear todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Haz clic en **"Publicar"** (Publish)

**Opción B: Desde la Terminal (con Firebase CLI)**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar en el proyecto
cd "C:\Users\Lenovo\Downloads\finanzas mensuals noviembre\finanzas-mensuales"
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

---

## 🔒 ¿Qué hacen estas reglas?

### Reglas Simples (Recomendadas para tu caso)

```javascript
match /usuarios/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Significa:**
- ✅ Cada usuario autenticado (anónimo) solo puede leer/escribir sus propios datos
- ✅ Si Daniel abre la app en su celular → se crea un usuario anónimo con ID único
- ✅ Si Pareja abre la app en su celular → se crea OTRO usuario anónimo diferente
- ❌ Daniel NO puede ver los datos de Pareja y viceversa

---

### Si quieren COMPARTIR datos entre los dos:

Usa esta estructura:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Datos compartidos entre la pareja
    match /shared/finanzas {
      allow read, write: if request.auth != null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Y modifica el código para usar `shared/finanzas` en lugar de `usuarios/{userId}`

---

## 🧪 Probar la Configuración

### 1. Verificar Authentication

```javascript
// Abre la consola del navegador (F12) y ejecuta:
console.log('Usuario autenticado:', auth.currentUser);
// Debería mostrar un objeto con uid, isAnonymous: true
```

### 2. Verificar Firestore

1. Abre la app: `index.html`
2. Registra un gasto
3. Ve a Firebase Console → Firestore Database
4. Deberías ver una colección `usuarios` con un documento (tu userId)

---

## 🔄 Sincronización Automática

La app ahora:
1. ✅ Se conecta a Firebase al iniciar
2. ✅ Autentica automáticamente de forma anónima
3. ✅ Carga datos desde Firestore
4. ✅ Guarda cada cambio en Firestore Y localStorage (backup)
5. ✅ Si Firebase falla, usa localStorage automáticamente

---

## ⚠️ Importante: Datos Anónimos

**Ventajas:**
- ✅ No requiere email/password
- ✅ Datos sincronizados en la nube
- ✅ Acceso desde cualquier dispositivo

**Limitaciones:**
- ⚠️ Si borras los datos del navegador, pierdes acceso a tu usuario anónimo
- ⚠️ No puedes "recuperar" tu cuenta sin el ID único
- ⚠️ Cada navegador/dispositivo es un usuario diferente

**Solución:** Guardar el `userId` para vincular dispositivos:

```javascript
// Ver tu userId único
console.log('Tu ID:', auth.currentUser.uid);

// Guárdalo en un lugar seguro si quieres acceder desde otro dispositivo
```

---

## 🚀 Desplegar a Vercel con Firebase

Firebase funciona perfectamente con Vercel porque todo es frontend:

```bash
cd "C:\Users\Lenovo\Downloads\finanzas mensuals noviembre\finanzas-mensuales"
vercel --prod
```

No necesitas configuración adicional. Firebase se conecta desde el navegador del usuario.

---

## 🆘 Solución de Problemas

### Error: "Missing or insufficient permissions"
- **Causa:** Las reglas de Firestore están bloqueando el acceso
- **Solución:** Verifica que las reglas estén publicadas correctamente

### Error: "Firebase: Error (auth/...)"
- **Causa:** Authentication no está habilitado
- **Solución:** Activa "Anónimo" en Authentication

### Los datos no se sincronizan
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que `useFirebase = true` en app.js

### Modo offline automático
Si ves: "Error al conectar con Firebase. Usando modo local."
- La app funciona normal, pero solo con localStorage
- Verifica tu conexión a internet
- Verifica las credenciales en `firebase-config.js`

---

## 📊 Estructura de Datos en Firestore

```
firestore
└── usuarios
    └── {userId} (ej: "abc123xyz")
        ├── usuarios: [...]
        ├── categorias: [...]
        ├── necesidades: [...]
        ├── transacciones: [...]
        ├── usuarioActual: 1
        ├── mesActual: "11-2024"
        ├── configuracion: {...}
        └── updatedAt: "2024-11-01T10:30:00.000Z"
```

---

¡Todo listo! Sigue los pasos pendientes en Firebase Console y tu app estará 100% funcional con sincronización en la nube. 🎉
