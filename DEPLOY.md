# 🚀 Guía de Despliegue en Vercel

## Opción 1: Despliegue Rápido desde la Web (Recomendado)

### 1. Preparar el repositorio en GitHub

```bash
# Inicializar Git en el proyecto (si no lo está)
cd "C:\Users\Lenovo\Downloads\finanzas mensuals noviembre\finanzas-mensuales"
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Finanzas Mensuales v1.0"

# Crear repositorio en GitHub y conectar
# Ve a github.com y crea un nuevo repositorio
# Luego conecta:
git remote add origin https://github.com/TU-USUARIO/finanzas-mensuales.git
git branch -M main
git push -u origin main
```

### 2. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Add New Project"**
3. Conecta tu cuenta de GitHub (si no lo has hecho)
4. Selecciona el repositorio `finanzas-mensuales`
5. Vercel detectará automáticamente que es un sitio estático
6. Haz clic en **"Deploy"**
7. ¡Listo! Tu app estará disponible en una URL como: `https://finanzas-mensuales.vercel.app`

---

## Opción 2: Despliegue desde la Terminal

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
# Sigue las instrucciones en el navegador
```

### 3. Desplegar

```bash
# Desde la carpeta del proyecto
cd "C:\Users\Lenovo\Downloads\finanzas mensuals noviembre\finanzas-mensuales"

# Primer despliegue (preview)
vercel

# Desplegar a producción
vercel --prod
```

---

## 📝 Configuración (Ya está lista)

Los siguientes archivos ya están configurados:

- ✅ `vercel.json` - Configuración de Vercel
- ✅ `package.json` - Metadata del proyecto
- ✅ `.gitignore` - Archivos a ignorar
- ✅ `README.md` - Documentación

---

## 🔄 Actualizar el Sitio

### Si desplegaste desde GitHub:
1. Haz cambios en tu código
2. Commit y push:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push
   ```
3. Vercel automáticamente detectará los cambios y redesplegará

### Si desplegaste desde la terminal:
```bash
vercel --prod
```

---

## 🌐 Configurar Dominio Personalizado (Opcional)

1. Ve a tu proyecto en Vercel Dashboard
2. Haz clic en "Settings" > "Domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

---

## ✨ Mejoras Post-Despliegue

### Agregar Analytics (Opcional)
```bash
# Vercel Analytics (gratis)
npm install @vercel/analytics
```

Luego agrega al final de `index.html`:
```html
<script src="https://cdn.vercel-insights.com/v1/script.js" defer></script>
```

---

## ⚠️ Notas Importantes

1. **Datos locales**: Los datos se guardan en localStorage del navegador, NO en un servidor
2. **Sin backend**: Esta es una aplicación 100% frontend
3. **Privacidad**: Los datos nunca salen del navegador del usuario
4. **Respaldos**: Recuerda exportar tus datos regularmente como CSV

---

## 🆘 Solución de Problemas

### Error: "No such file or directory"
- Asegúrate de estar en la carpeta correcta del proyecto

### Error: "Git not initialized"
- Ejecuta `git init` en la carpeta del proyecto

### La página no carga
- Verifica que `index.html` esté en la raíz del proyecto
- Revisa los logs en Vercel Dashboard

### Los estilos no se aplican
- Verifica que `style.css` esté en la misma carpeta que `index.html`
- Asegúrate de que el link en HTML sea correcto: `<link rel="stylesheet" href="style.css">`

---

## 📧 Soporte

Si tienes problemas, revisa:
- [Documentación de Vercel](https://vercel.com/docs)
- Los logs en Vercel Dashboard
- La consola del navegador (F12)

---

¡Feliz despliegue! 🎉
