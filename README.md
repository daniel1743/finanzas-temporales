# 💰 Finanzas Mensuales

Aplicación web para el control de finanzas personales de parejas.

## 🚀 Características

- ✅ **Registro de gastos** con categorías personalizables
- 📊 **Dashboard interactivo** con gráficos en tiempo real
- 💳 **Gestión de transacciones** con filtros avanzados
- 📜 **Historial mensual** con resúmenes automáticos
- 📥 **Exportación a CSV** de todas tus transacciones
- 👥 **Multi-usuario** (Daniel y Pareja)
- 🌙 **Modo oscuro** automático
- 💾 **Almacenamiento local** - tus datos nunca salen de tu dispositivo

## 🛠️ Tecnologías

- HTML5
- CSS3 (Custom Design System)
- JavaScript Vanilla
- Chart.js para visualizaciones
- LocalStorage para persistencia

## 📦 Despliegue en Vercel

### Opción 1: Desde la Web de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Importa tu repositorio desde GitHub
4. Vercel detectará automáticamente la configuración
5. Haz clic en "Deploy"

### Opción 2: Desde la Terminal

```bash
# Instala Vercel CLI globalmente
npm install -g vercel

# Inicia sesión (solo la primera vez)
vercel login

# Despliega desde la carpeta del proyecto
cd "C:\Users\Lenovo\Downloads\finanzas mensuals noviembre\finanzas-mensuales"
vercel

# Para producción
vercel --prod
```

## 🔒 Seguridad

- ✅ Sanitización de inputs (prevención XSS)
- ✅ Manejo de errores con try-catch
- ✅ Validación de datos en el frontend
- ✅ Sin backend - todos los datos se almacenan localmente

## 📝 Uso

1. **Registrar ingresos**: En la pestaña "Registro", ingresa tus ingresos mensuales
2. **Agregar gastos**: Completa el formulario con monto, descripción, categoría y nivel de necesidad
3. **Ver estadísticas**: Navega a "Dashboard" para ver gráficos y resúmenes
4. **Filtrar transacciones**: Usa la pestaña "Transacciones" para buscar gastos específicos
5. **Exportar datos**: Desde "Historial" puedes descargar un CSV con todas tus transacciones

## 🎨 Personalización

Puedes personalizar:
- Categorías de gastos
- Niveles de necesidad
- Usuarios
- Foto de perfil

## ⚠️ Importante

Los datos se almacenan en **localStorage** del navegador:
- No se sincronizan entre dispositivos
- Se borran si limpias los datos del navegador
- Exporta regularmente tus datos como respaldo

## 📄 Licencia

Proyecto personal - Uso libre

---

Desarrollado con ❤️ para gestión financiera de parejas
