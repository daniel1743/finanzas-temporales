# 🔐 Activar Autenticación Email/Password en Firebase

## ✅ Pasos para Habilitar Email/Password

### 1. Ir a Firebase Console

Accede a: https://console.firebase.google.com/project/aplicacion-gastos-temporal/authentication/providers

### 2. Activar Email/Password

1. En la página de **Authentication**, verás la pestaña **"Sign-in method"** (Método de inicio de sesión)
2. Busca **"Email/Password"** en la lista de proveedores nativos
3. Haz clic en **"Email/Password"**
4. **Activa** el toggle "Enable" (Habilitar)
5. (Opcional) Puedes activar también "Email link (passwordless sign-in)" si quieres
6. Haz clic en **"Guardar"** (Save)

✅ ¡Listo! Email/Password está habilitado

---

## 🧪 Probar el Modal

1. Abre tu aplicación: `index.html`
2. Deberías ver el modal de autenticación con dos pestañas:
   - **Iniciar Sesión**
   - **Registrarse**

### Opción 1: Registrarse (Primera vez)

1. Haz clic en la pestaña **"Registrarse"**
2. Completa:
   - Nombre: `Daniel` (o tu nombre)
   - Email: `tu@email.com`
   - Contraseña: mínimo 6 caracteres
   - Confirmar contraseña
3. Haz clic en **"Crear Cuenta"**
4. El modal se cerrará y verás: `¡Bienvenido Daniel!`

### Opción 2: Continuar sin cuenta (Anónimo)

1. Haz clic en **"Continuar sin cuenta"**
2. Se creará un usuario anónimo temporal
3. Tus datos se guardarán pero no podrás recuperarlos si cambias de dispositivo

### Opción 3: Iniciar Sesión (Si ya tienes cuenta)

1. Pestaña **"Iniciar Sesión"**
2. Ingresa tu email y contraseña
3. Haz clic en **"Iniciar Sesión"**

---

## 🔍 Verificar Usuarios Registrados

1. Ve a Firebase Console → **Authentication** → pestaña **"Users"**
2. Deberías ver los usuarios registrados:
   - Usuarios con email: muestra el email
   - Usuarios anónimos: muestra "Anonymous" y un ID único

---

## ⚙️ Configuraciones Adicionales (Opcional)

### Restablecer Contraseña

Firebase automáticamente envía emails para restablecer contraseña. Para activarlo:

1. Authentication → **Templates** (Plantillas)
2. Personaliza el email de "Password reset" (Restablecer contraseña)
3. Cambia el idioma a Español si quieres

### Verificación de Email

Si quieres que los usuarios verifiquen su email:

1. En el código, después de registrar, puedes agregar:
```javascript
import { sendEmailVerification } from 'firebase/auth';

// Después de registerWithEmail
await sendEmailVerification(user);
```

Pero para tu caso (app de pareja, 2 meses) **no es necesario**.

---

## 🎨 Personalizar el Modal

Si quieres cambiar los colores o textos del modal, edita:

**HTML:** `index.html` - líneas 396-448
**CSS:** `style.css` - líneas 742-811
**JS:** `app.js` - líneas 1153-1295

---

## 🔒 Seguridad

### Reglas de Firestore Actuales

```javascript
match /usuarios/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Esto significa:**
- ✅ Solo usuarios autenticados pueden acceder
- ✅ Cada usuario solo ve sus propios datos
- ✅ Daniel no puede ver los datos de Pareja y viceversa

### Para Compartir Datos entre la Pareja

Si quieren que **ambos vean los mismos datos**, cambia las reglas a:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Datos compartidos para la pareja
    match /shared/finanzas {
      allow read, write: if request.auth != null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Y modifica el código para guardar en `shared/finanzas` en lugar de `usuarios/{userId}`

---

## ❓ Mensajes de Error Traducidos

El modal ya traduce los errores de Firebase:

| Error Firebase | Mensaje al Usuario |
|----------------|-------------------|
| `auth/email-already-in-use` | "Este email ya está registrado" |
| `auth/invalid-email` | "Email inválido" |
| `auth/user-not-found` | "Usuario no encontrado" |
| `auth/wrong-password` | "Contraseña incorrecta" |
| `auth/weak-password` | "La contraseña es muy débil" |
| `auth/too-many-requests` | "Demasiados intentos. Intenta más tarde" |

---

## ✅ Checklist Final

- [ ] Email/Password habilitado en Firebase Console
- [ ] Modal se muestra al abrir la app
- [ ] Puedes registrar un nuevo usuario
- [ ] Puedes iniciar sesión con el usuario creado
- [ ] Puedes continuar como anónimo
- [ ] Los datos se sincronizan con Firestore
- [ ] Cada usuario ve solo sus propios datos

---

¡Todo listo! Tu app ahora tiene autenticación completa con Firebase. 🎉
