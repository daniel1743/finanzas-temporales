// ============================================
// FINANZAS MENSUALES - JavaScript Application
// ============================================

import {
  initializeFirebaseAuth,
  saveToFirestore,
  loadFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  continueAnonymously
} from './firebase-config.js';

// Variables globales para almacenar datos
let appData = {
  usuarios: [],
  categorias: [],
  necesidades: [],
  transacciones: [],
  historial: [], // Nuevo: historial de todas las acciones
  usuarioActual: 1,
  mesActual: '',
  configuracion: {}
};

// Exponer appData globalmente para que historial.js pueda acceder
window.appData = appData;

let chartInstances = {};
let selectedNecesidad = '';
let useFirebase = true; // Toggle para usar Firebase o localStorage

// ============================================
// FUNCIONES DE UTILIDAD - FORMATEO CHILENO
// ============================================

// Funciones para parsear y formatear números en formato chileno (1.000, 10.000, etc.)
function parseChileanNumber(value) {
  if (!value) return 0;
  // Remover puntos y parsear
  const numericString = value.toString().replace(/\./g, '');
  return parseInt(numericString, 10) || 0;
}

function formatChileanNumber(value) {
  const number = parseInt(value, 10);
  if (isNaN(number)) return '';
  return number.toLocaleString('es-CL');
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Verificar si hay una sesión activa
    const autoLogin = localStorage.getItem('autoLogin');

    if (autoLogin === 'true') {
      // Si hay sesión activa, inicializar la app directamente
      console.log('Sesión activa encontrada, inicializando app...');
      await initializeFirebaseAuth();
      await initializeApp();
      setupEventListeners();
      updateUI();
    } else {
      // Si no hay sesión, mostrar modal de autenticación
      showAuthModal();
    }
  } catch (error) {
    console.error('Error al inicializar:', error);
    showToast('Error al iniciar la aplicación', 'error');
  }
});

async function initializeApp() {
  console.log('🚀 Iniciando aplicación...');

  // Cargar o inicializar datos desde variables en memoria
  await loadAppData();

  console.log('📊 Datos cargados:', appData);

  // Configurar fecha actual por defecto
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fechaGasto').value = today;

  // Actualizar mes actual
  appData.mesActual = getCurrentMonth();

  // Inicializar gráficos
  initializeCharts();

  console.log('✅ Aplicación inicializada');
}

async function loadAppData() {
  try {
    if (useFirebase) {
      // Intentar cargar desde Firestore primero
      const firestoreData = await loadFromFirestore();

      if (firestoreData) {
        appData = {
          ...appData,
          ...firestoreData
        };
        window.appData = appData; // Sincronizar con window
        console.log('Datos cargados desde Firestore');
      } else {
        // Si no hay datos en Firestore, intentar localStorage
        const localData = localStorage.getItem('finanzasAppData');
        if (localData) {
          const parsed = JSON.parse(localData);
          appData = {
            ...appData,
            ...parsed
          };
          window.appData = appData; // Sincronizar con window
          console.log('Datos cargados desde localStorage');
          // Sincronizar a Firestore
          await saveToFirestore(appData);
          console.log('Datos migrados a Firestore');
        } else {
          initializeDefaultData();
        }
      }
    } else {
      // Modo offline: usar solo localStorage
      const savedData = localStorage.getItem('finanzasAppData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        appData = {
          ...appData,
          ...parsed
        };
        window.appData = appData; // Sincronizar con window
        console.log('Datos cargados desde localStorage');
      } else {
        initializeDefaultData();
      }
    }
  } catch (error) {
    console.error('Error al cargar datos:', error);
    showToast('Error al cargar datos. Usando datos locales.', 'error');

    // Fallback a localStorage
    try {
      const savedData = localStorage.getItem('finanzasAppData');
      if (savedData) {
        appData = JSON.parse(savedData);
        window.appData = appData; // Sincronizar con window
      } else {
        initializeDefaultData();
      }
    } catch (e) {
      initializeDefaultData();
    }
  }

  // Actualizar selects con usuarios y categorías
  updateUserSelects();
  updateCategorySelects();

  // Renderizar botones de necesidad personalizados
  renderNecessityButtons();

  // Actualizar sugerencias de autocompletado
  actualizarSugerencias();
}

function initializeDefaultData() {
  if (appData.usuarios.length === 0) {
    appData.usuarios = [
      { id: 1, nombre: 'Daniel', foto: '', ingresoBase: 0, ingresoExtra: 0, ingresosAcumulados: 0 },
      { id: 2, nombre: 'Pareja', foto: '', ingresoBase: 0, ingresoExtra: 0, ingresosAcumulados: 0 }
    ];
  } else {
    // Asegurar que usuarios existentes tengan el campo ingresosAcumulados
    appData.usuarios.forEach(usuario => {
      if (usuario.ingresosAcumulados === undefined) {
        usuario.ingresosAcumulados = 0;
      }
    });
  }

  if (appData.categorias.length === 0) {
    appData.categorias = [
      'Alimentación 🍞',
      'Transporte 🚗',
      'Entretenimiento 🎬',
      'Salud 💊',
      'Educación 📚',
      'Otro ➕'
    ];
  }

  if (appData.necesidades.length === 0) {
    appData.necesidades = ['Baja', 'Media', 'Alta', 'Crítica'];
  }

  if (appData.transacciones.length === 0) {
    appData.transacciones = [];
  }

  if (!appData.historial) {
    appData.historial = [];
  }

  // Sincronizar con window
  window.appData = appData;
}

async function saveAppData() {
  try {
    // Siempre guardar en localStorage como backup
    localStorage.setItem('finanzasAppData', JSON.stringify(appData));
    console.log('Datos guardados en localStorage');

    // Si Firebase está habilitado, guardar también en Firestore
    if (useFirebase) {
      await saveToFirestore(appData);
      console.log('Datos sincronizados con Firestore');
    }
  } catch (error) {
    console.error('Error al guardar datos:', error);
    showToast('Error al guardar datos', 'error');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Navegación entre tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Selector de usuario global
  document.getElementById('currentUser').addEventListener('change', handleUserChange);
  
  // Formulario de registro
  document.getElementById('registroForm').addEventListener('submit', handleRegistroSubmit);
  document.getElementById('limpiarForm').addEventListener('click', limpiarFormulario);
  
  // Botones de necesidad
  document.querySelectorAll('.necessity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.necessity-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedNecesidad = this.dataset.level;
    });
  });
  
  // Botón agregar necesidad personalizada
  document.getElementById('addNecesidad').addEventListener('click', agregarNecesidadPersonalizada);
  
  // Categoría personalizada
  document.getElementById('categoria').addEventListener('change', function() {
    if (this.value === 'nueva') {
      agregarCategoriaPersonalizada();
    }
  });
  
  // Botón flotante y modal
  document.getElementById('btnFlotante').addEventListener('click', () => {
    document.getElementById('modalRapido').classList.add('active');
  });
  
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modalRapido').classList.remove('active');
    resetearModalRapido();
  });
  
  document.getElementById('gastoRapidoForm').addEventListener('submit', handleGastoRapido);
  
  // Toggle de detalles en dashboard
  document.querySelectorAll('.toggle-details').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.dataset.card;
      const details = document.getElementById(`${card}Details`);
      if (details.style.display === 'none') {
        details.style.display = 'block';
        this.classList.add('active');
      } else {
        details.style.display = 'none';
        this.classList.remove('active');
      }
    });
  });
  
  // Filtros de transacciones
  document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
  document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
  
  // Exportar CSV
  document.getElementById('exportarCSV').addEventListener('click', exportarCSV);
  
  // Configuración
  document.getElementById('uploadFoto').addEventListener('change', handleFotoUpload);
  document.getElementById('guardarPerfil').addEventListener('click', guardarPerfil);
  document.getElementById('reiniciarDatos').addEventListener('click', reiniciarDatos);
  
  // Actualizar ingresos base y extra
  document.getElementById('ingresoBase').addEventListener('change', actualizarIngresos);
  document.getElementById('ingresoExtra').addEventListener('change', actualizarIngresos);
  document.getElementById('ingresoBase').addEventListener('blur', actualizarIngresos);
  document.getElementById('ingresoExtra').addEventListener('blur', actualizarIngresos);

  // Botón agregar ingreso
  document.getElementById('btnAgregarIngreso').addEventListener('click', agregarIngreso);

  // Event delegation para botones de acciones en transacciones
  document.getElementById('transaccionesBody').addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-icon');
    if (btn) {
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);

      if (action === 'editar') {
        editarTransaccion(id);
      } else if (action === 'eliminar') {
        eliminarTransaccion(id);
      }
    }
  });
}

// ============================================
// NAVEGACIÓN
// ============================================

function switchTab(tabName) {
  // Ocultar todos los tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Desactivar todos los botones de navegación
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Activar el tab seleccionado
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Actualizar contenido según el tab
  if (tabName === 'dashboard') {
    updateDashboard();
  } else if (tabName === 'transacciones') {
    updateTransacciones();
  } else if (tabName === 'historial') {
    updateHistorial();
  } else if (tabName === 'configuracion') {
    updateConfiguracion();
  }
}

// ============================================
// MANEJO DE USUARIOS
// ============================================

function handleUserChange(e) {
  const value = e.target.value;
  
  if (value === 'new') {
    const nombre = prompt('Ingresa el nombre del nuevo usuario:');
    if (nombre && nombre.trim()) {
      // Generar ID único (máximo ID actual + 1)
      const maxId = appData.usuarios.length > 0
        ? Math.max(...appData.usuarios.map(u => u.id))
        : 0;

      const newUser = {
        id: maxId + 1,
        nombre: nombre.trim(),
        foto: '',
        ingresoBase: 0,
        ingresoExtra: 0,
        ingresosAcumulados: 0
      };

      appData.usuarios.push(newUser);
      appData.usuarioActual = newUser.id;

      // Sincronizar con window.appData
      window.appData = appData;

      updateUserSelects();
      saveAppData();
      updateUI();

      showToast(`✅ Usuario "${nombre.trim()}" agregado correctamente`, 'success');

      console.log('✅ Nuevo usuario creado:', newUser);
    } else {
      // Si cancela, volver al usuario actual
      e.target.value = appData.usuarioActual;
    }
  } else {
    // Cambiar a usuario existente
    const oldUserId = appData.usuarioActual;
    appData.usuarioActual = parseInt(value);

    // Sincronizar con window.appData
    window.appData = appData;

    saveAppData();
    updateUI();

    const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
    if (usuario) {
      showToast(`Cambiado a usuario: ${usuario.nombre}`, 'info');
      console.log('✅ Usuario cambiado:', usuario);
    }
  }
}

function updateUserSelects() {
  const selects = [document.getElementById('currentUser'), document.getElementById('usuarioGasto')];
  
  selects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '';
    
    appData.usuarios.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.nombre;
      select.appendChild(option);
    });
    
    if (select.id === 'currentUser') {
      const newOption = document.createElement('option');
      newOption.value = 'new';
      newOption.textContent = '+ Agregar nuevo usuario';
      select.appendChild(newOption);
      select.value = appData.usuarioActual;
    } else {
      select.value = currentValue || appData.usuarios[0].id;
    }
  });
}

// ============================================
// REGISTRO DE GASTOS
// ============================================

function handleRegistroSubmit(e) {
  e.preventDefault();

  console.log('💵 Registrando gasto...');

  try {
    // Validar campos obligatorios
    const montoGastoValue = document.getElementById('montoGasto').value;
    const montoGasto = parseChileanNumber(montoGastoValue);
    const descripcion = document.getElementById('descripcionGasto').value.trim();
    const categoria = document.getElementById('categoria').value;
    const fecha = document.getElementById('fechaGasto').value;
    const usuario = document.getElementById('usuarioGasto').value;

    console.log('Datos del gasto:', { montoGasto, descripcion, categoria, fecha, usuario, selectedNecesidad });

    if (!montoGasto || montoGasto <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      console.error('❌ Monto inválido');
      return;
    }

    if (!descripcion) {
      showToast('La descripción es obligatoria', 'error');
      return;
    }

    if (!categoria) {
      showToast('Debes seleccionar una categoría', 'error');
      return;
    }

    if (!selectedNecesidad) {
      showToast('Debes seleccionar un nivel de necesidad', 'error');
      return;
    }

    // Validar fecha
    const fechaGasto = new Date(fecha);
    const fechaActual = new Date();
    if (fechaGasto > fechaActual) {
      showToast('La fecha no puede ser futura', 'error');
      return;
    }

    // Crear transacción
    const usuarioObj = appData.usuarios.find(u => u.id == usuario);
    if (!usuarioObj) {
      showToast('Usuario no encontrado', 'error');
      return;
    }

    const transaccion = {
      id: Date.now(),
      fecha: fecha,
      usuario: usuarioObj.nombre,
      tipo: 'gasto',
      descripcion: descripcion,
      monto: montoGasto,
      categoria: categoria,
      necesidad: selectedNecesidad,
      items: document.getElementById('items').value.trim(),
      notas: document.getElementById('notas').value.trim(),
      mes: getCurrentMonth()
    };

    appData.transacciones.push(transaccion);

    // Registrar en historial
    if (typeof window.registrarEnHistorial === 'function') {
      window.registrarEnHistorial('gasto', `Gasto registrado: ${descripcion}`, {
        monto: montoGasto,
        categoria: categoria,
        necesidad: selectedNecesidad
      });
    }

    saveAppData();

    // Actualizar UI y dashboard
    updateUI();
    updateDashboard(); // Actualizar dashboard siempre

    showToast('Gasto registrado correctamente', 'success');
    limpiarFormulario();

    // Actualizar sugerencias con la nueva descripción
    actualizarSugerencias();

    updateUI();
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    showToast('Error al registrar el gasto. Intenta nuevamente.', 'error');
  }
}

function actualizarIngresos() {
  console.log('💰 Actualizando ingresos...');

  const ingresoBaseValue = document.getElementById('ingresoBase').value;
  const ingresoExtraValue = document.getElementById('ingresoExtra').value;

  const ingresoBase = parseChileanNumber(ingresoBaseValue) || 0;
  const ingresoExtra = parseChileanNumber(ingresoExtraValue) || 0;

  console.log('Valores parseados:', { ingresoBase, ingresoExtra });

  const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
  if (usuario) {
    const anteriorBase = usuario.ingresoBase || 0;
    const anteriorExtra = usuario.ingresoExtra || 0;

    usuario.ingresoBase = ingresoBase;
    usuario.ingresoExtra = ingresoExtra;
    console.log('Usuario actualizado:', usuario);

    // Registrar en historial si hubo cambios
    if (typeof window.registrarEnHistorial === 'function') {
      if (anteriorBase !== ingresoBase || anteriorExtra !== ingresoExtra) {
        window.registrarEnHistorial('modificacion', 'Ingresos actualizados', {
          anterior: `Base: ${formatCLP(anteriorBase)}, Extra: ${formatCLP(anteriorExtra)}`,
          nuevo: `Base: ${formatCLP(ingresoBase)}, Extra: ${formatCLP(ingresoExtra)}`
        });
      }
    }

    saveAppData();

    // Actualizar UI completa
    updateUI();

    // SIEMPRE actualizar el dashboard (incluso si no está visible)
    updateDashboard();

    console.log('✅ Ingresos actualizados y dashboard refrescado');
  } else {
    console.error('❌ Usuario no encontrado');
  }
}

function agregarIngreso() {
  const ingresoBase = parseChileanNumber(document.getElementById('ingresoBase').value) || 0;
  const ingresoExtra = parseChileanNumber(document.getElementById('ingresoExtra').value) || 0;

  if (ingresoBase === 0 && ingresoExtra === 0) {
    showToast('Debes ingresar al menos un monto', 'error');
    return;
  }

  const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
  if (!usuario) {
    showToast('Usuario no encontrado', 'error');
    return;
  }

  // Sumar los ingresos al acumulado
  const totalNuevoIngreso = ingresoBase + ingresoExtra;
  usuario.ingresosAcumulados = (usuario.ingresosAcumulados || 0) + totalNuevoIngreso;

  // Registrar en historial
  if (typeof window.registrarEnHistorial === 'function') {
    let detalleIngreso = '';
    if (ingresoBase > 0 && ingresoExtra > 0) {
      detalleIngreso = `Base: ${formatCLP(ingresoBase)}, Extra: ${formatCLP(ingresoExtra)}`;
    } else if (ingresoBase > 0) {
      detalleIngreso = `Base: ${formatCLP(ingresoBase)}`;
    } else {
      detalleIngreso = `Extra: ${formatCLP(ingresoExtra)}`;
    }

    window.registrarEnHistorial('ingreso', `Ingreso agregado: ${formatCLP(totalNuevoIngreso)}`, {
      monto: totalNuevoIngreso,
      categoria: detalleIngreso
    });
  }

  // Limpiar los campos
  document.getElementById('ingresoBase').value = '';
  document.getElementById('ingresoExtra').value = '';

  // Actualizar usuario
  usuario.ingresoBase = 0;
  usuario.ingresoExtra = 0;

  // Mostrar el panel de ingresos acumulados
  const panelAcumulados = document.getElementById('ingresosAgregados');
  panelAcumulados.style.display = 'block';
  document.getElementById('totalIngresosAcumulados').textContent = formatCLP(usuario.ingresosAcumulados);

  saveAppData();
  updateUI();
  updateDashboard(); // Actualizar dashboard siempre
  showToast(`Ingreso de ${formatCLP(totalNuevoIngreso)} agregado correctamente`, 'success');
}

function limpiarFormulario() {
  document.getElementById('montoGasto').value = '';
  document.getElementById('descripcionGasto').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('items').value = '';
  document.getElementById('notas').value = '';
  document.querySelectorAll('.necessity-btn').forEach(btn => btn.classList.remove('active'));
  selectedNecesidad = '';
}

function handleGastoRapido(e) {
  e.preventDefault();

  try {
    const monto = parseChileanNumber(document.getElementById('montoRapido').value);
    const descripcion = document.getElementById('descripcionRapido').value.trim();
    const categoria = document.getElementById('categoriaRapido').value;
    const transaccionId = document.getElementById('transaccionIdRapido').value;
    const esGastoRapido = document.getElementById('esGastoRapido').checked;

    if (!monto || !descripcion || !categoria) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    // Verificar si es edición o nuevo gasto
    if (transaccionId) {
      // EDITAR transacción existente
      const transaccion = appData.transacciones.find(t => t.id == transaccionId);
      if (transaccion) {
        const cambios = [];
        if (transaccion.monto !== monto) cambios.push(`Monto: ${formatCLP(transaccion.monto)} → ${formatCLP(monto)}`);
        if (transaccion.descripcion !== descripcion) cambios.push(`Descripción: "${transaccion.descripcion}" → "${descripcion}"`);
        if (transaccion.categoria !== categoria) cambios.push(`Categoría: ${transaccion.categoria} → ${categoria}`);

        transaccion.monto = monto;
        transaccion.descripcion = descripcion;
        transaccion.categoria = categoria;
        transaccion.esGastoRapido = esGastoRapido;

        // Registrar en historial
        if (cambios.length > 0 && typeof window.registrarEnHistorial === 'function') {
          window.registrarEnHistorial('modificacion', `Gasto rápido modificado: ${descripcion}`, {
            anterior: cambios.join(', ')
          });
        }

        saveAppData();
        showToast('Gasto actualizado correctamente', 'success');
      }
    } else {
      // CREAR nueva transacción
      const transaccion = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        usuario: appData.usuarios.find(u => u.id === appData.usuarioActual).nombre,
        tipo: 'gasto',
        descripcion: descripcion,
        monto: monto,
        categoria: categoria,
        necesidad: 'Media',
        items: '',
        notas: '',
        mes: getCurrentMonth(),
        esGastoRapido: esGastoRapido  // Marcar como gasto rápido
      };

      appData.transacciones.push(transaccion);

      // Registrar en historial
      if (typeof window.registrarEnHistorial === 'function') {
        window.registrarEnHistorial('gasto', `Gasto rápido agregado: ${descripcion}`, {
          monto: monto,
          categoria: categoria
        });
      }

      saveAppData();
      showToast('Gasto agregado correctamente', 'success');
    }

    document.getElementById('modalRapido').classList.remove('active');
    document.getElementById('gastoRapidoForm').reset();

    // Actualizar sugerencias con la nueva descripción
    actualizarSugerencias();

    updateUI();
  } catch (error) {
    console.error('Error en gasto rápido:', error);
    showToast('Error al guardar el gasto', 'error');
  }
}

// ============================================
// CATEGORÍAS Y NECESIDADES
// ============================================

function agregarCategoriaPersonalizada() {
  const nombre = prompt('Ingresa el nombre de la nueva categoría:');
  if (nombre && nombre.trim()) {
    const newCategory = nombre.trim();
    if (!appData.categorias.includes(newCategory)) {
      appData.categorias.push(newCategory);
      updateCategorySelects();
      document.getElementById('categoria').value = newCategory;
      saveAppData();
      showToast('Categoría agregada correctamente', 'success');
    }
  } else {
    document.getElementById('categoria').value = '';
  }
}

function agregarNecesidadPersonalizada() {
  const nombre = prompt('Ingresa el nombre del nuevo nivel de necesidad:');
  if (nombre && nombre.trim()) {
    const newNecesidad = nombre.trim();
    if (!appData.necesidades.includes(newNecesidad)) {
      appData.necesidades.push(newNecesidad);

      // Guardar en appData para que persista
      saveAppData();

      // Re-renderizar los botones de necesidad
      renderNecessityButtons();

      showToast(`Nivel "${newNecesidad}" agregado correctamente`, 'success');
    } else {
      showToast('Ese nivel ya existe', 'error');
    }
  }
}

function renderNecessityButtons() {
  const container = document.querySelector('.necessity-buttons');
  const addBtn = document.getElementById('addNecesidad');

  // Remover todos los botones excepto el de agregar
  const existingButtons = container.querySelectorAll('.necessity-btn');
  existingButtons.forEach(btn => btn.remove());

  // Agregar botones de necesidad desde appData
  appData.necesidades.forEach(nivel => {
    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'necessity-btn';
    newBtn.dataset.level = nivel;
    newBtn.textContent = nivel;
    newBtn.addEventListener('click', function() {
      document.querySelectorAll('.necessity-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedNecesidad = this.dataset.level;
    });
    container.insertBefore(newBtn, addBtn);
  });
}

function updateCategorySelects() {
  const selects = [
    document.getElementById('categoria'),
    document.getElementById('categoriaRapido'),
    document.getElementById('filterCategoria')
  ];
  
  selects.forEach(select => {
    const currentValue = select.value;
    const isFilter = select.id === 'filterCategoria';
    
    select.innerHTML = '';
    
    if (isFilter) {
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'Todas';
      select.appendChild(allOption);
    } else {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Seleccionar...';
      select.appendChild(emptyOption);
    }
    
    appData.categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
    
    if (!isFilter) {
      const newOption = document.createElement('option');
      newOption.value = 'nueva';
      newOption.textContent = '+ Agregar nueva categoría';
      select.appendChild(newOption);
    }
    
    if (currentValue) select.value = currentValue;
  });
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
  console.log('📊 Actualizando dashboard...');

  try {
    const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);

    if (!usuario) {
      showToast('Usuario no encontrado', 'error');
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log('Usuario actual:', usuario);

    // Actualizar perfil
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
      userGreeting.textContent = `Hola, ${usuario.nombre} 👋`;
    }

    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const currentDate = new Date();
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const monthInfo = document.getElementById('monthInfo');
    if (monthInfo) {
      monthInfo.textContent = `Tus finanzas de ${monthName} van así:`;
    }

    // Actualizar badge del mes en tarjeta resumen
    const mesResumenBadge = document.getElementById('mesResumenBadge');
    if (mesResumenBadge) {
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      mesResumenBadge.textContent = `${capitalizedMonth} ${year}`;
    }

    if (usuario.foto) {
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar) {
        userAvatar.src = usuario.foto;
      }
    }

    // Calcular totales
    const transaccionesMes = appData.transacciones.filter(t => t.mes === getCurrentMonth());
    const totalIngresos = usuario.ingresoBase + usuario.ingresoExtra + (usuario.ingresosAcumulados || 0);
    const totalGastos = transaccionesMes.reduce((sum, t) => sum + t.monto, 0);
    const balance = totalIngresos - totalGastos;

    // Actualizar tarjeta resumen del mes
    const inicioMesValor = document.getElementById('inicioMesValor');
    if (inicioMesValor) {
      inicioMesValor.textContent = formatCLP(totalIngresos);
    }

    const totalGastadoMes = document.getElementById('totalGastadoMes');
    if (totalGastadoMes) {
      totalGastadoMes.textContent = formatCLP(totalGastos);
    }

    const restanteMesValor = document.getElementById('restanteMesValor');
    if (restanteMesValor) {
      restanteMesValor.textContent = formatCLP(balance);
    }

    console.log('Cálculos del dashboard:', {
      ingresoBase: usuario.ingresoBase,
      ingresoExtra: usuario.ingresoExtra,
      ingresosAcumulados: usuario.ingresosAcumulados,
      totalIngresos,
      numTransacciones: transaccionesMes.length,
      totalGastos,
      balance
    });

    // Actualizar tarjetas básicas con validaciones
    const balanceGeneral = document.getElementById('balanceGeneral');
    if (balanceGeneral) balanceGeneral.textContent = formatCLP(balance);

    const ingresosTotal = document.getElementById('ingresosTotal');
    if (ingresosTotal) ingresosTotal.textContent = formatCLP(totalIngresos);

    const gastosTotal = document.getElementById('gastosTotal');
    if (gastosTotal) gastosTotal.textContent = formatCLP(totalGastos);

    const totalGastado = document.getElementById('totalGastado');
    if (totalGastado) totalGastado.textContent = formatCLP(totalGastos);

    const loQueQueda = document.getElementById('loQueQueda');
    if (loQueQueda) loQueQueda.textContent = formatCLP(balance);

    console.log('✅ Tarjetas actualizadas');

    // Actualizar promedio diario
    const diasMes = new Date().getDate();
    const promedioDiario = diasMes > 0 ? totalGastos / diasMes : 0;
    const diasEnMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const proyeccion = promedioDiario * diasEnMes;

    const promedioDiarioEl = document.getElementById('promedioDiario');
    if (promedioDiarioEl) promedioDiarioEl.textContent = formatCLP(promedioDiario);

    const diasMesEl = document.getElementById('diasMes');
    if (diasMesEl) diasMesEl.textContent = diasMes;

    const proyeccionMensualEl = document.getElementById('proyeccionMensual');
    if (proyeccionMensualEl) proyeccionMensualEl.textContent = formatCLP(proyeccion);

    // Actualizar categoría principal
    const categoriasSums = {};
    transaccionesMes.forEach(t => {
      if (!categoriasSums[t.categoria]) categoriasSums[t.categoria] = 0;
      categoriasSums[t.categoria] += t.monto;
    });

    // Categoría principal - COMENTADO porque ahora la tarjeta es "Últimos Movimientos"
    // const categoriaPrincipal = Object.entries(categoriasSums).sort((a, b) => b[1] - a[1])[0];
    // if (categoriaPrincipal) {
    //   document.getElementById('categoriaPrincipal').textContent = categoriaPrincipal[0];
    //   document.getElementById('montoCategoriaPrincipal').textContent = formatCLP(categoriaPrincipal[1]);
    //   const porcentaje = (categoriaPrincipal[1] / totalGastos * 100).toFixed(1);
    //   document.getElementById('porcentajeCategoria').textContent = porcentaje + '%';
    // }

    // Actualizar total de transacciones
    const totalTransacciones = document.getElementById('totalTransacciones');
    if (totalTransacciones) {
      totalTransacciones.textContent = transaccionesMes.length;
    }

    if (transaccionesMes.length > 0) {
      const montos = transaccionesMes.map(t => t.monto);
      const transaccionMaxima = document.getElementById('transaccionMaxima');
      if (transaccionMaxima) {
        transaccionMaxima.textContent = formatCLP(Math.max(...montos));
      }
      const transaccionMinima = document.getElementById('transaccionMinima');
      if (transaccionMinima) {
        transaccionMinima.textContent = formatCLP(Math.min(...montos));
      }
    }

    // Actualizar detalles de gastos por categoría
    const gastadoPorCategoria = document.getElementById('gastadoPorCategoria');
    if (gastadoPorCategoria) {
      gastadoPorCategoria.innerHTML = '';
      Object.entries(categoriasSums).forEach(([cat, sum]) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${sanitizeHTML(cat)}:</strong> ${formatCLP(sum)}`;
        gastadoPorCategoria.appendChild(p);
      });
    }

    // Actualizar barra de progreso
    const porcentajeUsado = totalIngresos > 0 ? (totalGastos / totalIngresos * 100) : 0;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(porcentajeUsado, 100)}%`;
    }
    const progressText = document.getElementById('progressText');
    if (progressText) {
      progressText.textContent = `${porcentajeUsado.toFixed(1)}% del presupuesto utilizado`;
    }

    // Actualizar gráficos
    updateCharts(transaccionesMes);

    // Actualizar mini historial de últimos 10 movimientos
    if (typeof window.actualizarMiniHistorial === 'function') {
      window.actualizarMiniHistorial();
    }
  } catch (error) {
    console.error('Error al actualizar dashboard:', error);
    showToast('Error al cargar el dashboard', 'error');
  }
}

// ============================================
// GRÁFICOS
// ============================================

function initializeCharts() {
  console.log('📊 Inicializando gráficos...');

  // ====== DESTRUIR GRÁFICOS EXISTENTES PRIMERO ======
  // Esto previene el error "Canvas is already in use"
  console.log('🧹 Destruyendo gráficos previos si existen...');

  if (chartInstances.pie) {
    try {
      chartInstances.pie.destroy();
      console.log('   ✅ chartInstances.pie destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir pie:', e.message);
    }
  }

  if (chartInstances.bar) {
    try {
      chartInstances.bar.destroy();
      console.log('   ✅ chartInstances.bar destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir bar:', e.message);
    }
  }

  if (chartInstances.radar) {
    try {
      chartInstances.radar.destroy();
      console.log('   ✅ chartInstances.radar destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir radar:', e.message);
    }
  }

  if (chartInstances.line) {
    try {
      chartInstances.line.destroy();
      console.log('   ✅ chartInstances.line destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir line:', e.message);
    }
  }

  if (chartInstances.balanceDoughnut) {
    try {
      chartInstances.balanceDoughnut.destroy();
      console.log('   ✅ chartInstances.balanceDoughnut destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir balanceDoughnut:', e.message);
    }
  }

  if (chartInstances.userComparison) {
    try {
      chartInstances.userComparison.destroy();
      console.log('   ✅ chartInstances.userComparison destruido');
    } catch (e) {
      console.warn('   ⚠️ Error al destruir userComparison:', e.message);
    }
  }

  console.log('✅ Gráficos previos destruidos, creando nuevos...');

  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

  // Verificar que los canvas existan antes de crear gráficos
  const chartPieCanvas = document.getElementById('chartPie');
  if (!chartPieCanvas) {
    console.warn('⚠️ Canvas chartPie no encontrado, saltando inicialización de gráficos');
    return;
  }

  // Gráfico de pastel - Gastos por categoría
  const ctxPie = chartPieCanvas.getContext('2d');
  chartInstances.pie = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  // Gráfico de barras - Necesarios vs Innecesarios
  const ctxBar = document.getElementById('chartBar').getContext('2d');
  chartInstances.bar = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['Necesarios', 'Innecesarios'],
      datasets: [{
        label: 'Gastos',
        data: [0, 0],
        backgroundColor: [colors[0], colors[1]]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Gráfico de radar - Nivel de necesidad
  const ctxRadar = document.getElementById('chartRadar').getContext('2d');
  chartInstances.radar = new Chart(ctxRadar, {
    type: 'radar',
    data: {
      labels: [],
      datasets: [{
        label: 'Gastos por Necesidad',
        data: [],
        backgroundColor: 'rgba(31, 184, 205, 0.2)',
        borderColor: colors[0],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        r: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Gráfico lineal - Evolución diaria
  const ctxLine = document.getElementById('chartLine').getContext('2d');
  chartInstances.line = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Gasto Diario',
        data: [],
        borderColor: colors[0],
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de Balance (Doughnut)
  const ctxBalance = document.getElementById('chartBalanceDoughnut');
  if (ctxBalance) {
    chartInstances.balanceDoughnut = new Chart(ctxBalance, {
      type: 'doughnut',
      data: {
        labels: ['Gastado', 'Disponible'],
        datasets: [{
          data: [0, 100],
          backgroundColor: [colors[2], colors[0]],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${formatCLP(value)}`;
              }
            }
          }
        }
      }
    });
  }

  // Gráfico de comparación por usuario
  const ctxUserComp = document.getElementById('chartUserComparison');
  if (ctxUserComp) {
    chartInstances.userComparison = new Chart(ctxUserComp, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Gastos por Usuario',
          data: [],
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCLP(value);
              }
            }
          }
        }
      }
    });
  }
}

function updateCharts(transacciones) {
  try {
    // Verificar que los gráficos estén inicializados
    if (!chartInstances.pie || !chartInstances.bar || !chartInstances.radar || !chartInstances.line) {
      console.warn('Los gráficos no están inicializados');
      return;
    }

    // Si no hay transacciones, limpiar gráficos
    if (!transacciones || transacciones.length === 0) {
      chartInstances.pie.data.labels = [];
      chartInstances.pie.data.datasets[0].data = [];
      chartInstances.pie.update('none');

      chartInstances.bar.data.datasets[0].data = [0, 0];
      chartInstances.bar.update('none');

      chartInstances.radar.data.labels = [];
      chartInstances.radar.data.datasets[0].data = [];
      chartInstances.radar.update('none');

      chartInstances.line.data.labels = [];
      chartInstances.line.data.datasets[0].data = [];
      chartInstances.line.update('none');

      if (chartInstances.balanceDoughnut) {
        chartInstances.balanceDoughnut.data.datasets[0].data = [0, 100];
        chartInstances.balanceDoughnut.update('none');
      }

      if (chartInstances.userComparison) {
        chartInstances.userComparison.data.labels = [];
        chartInstances.userComparison.data.datasets[0].data = [];
        chartInstances.userComparison.update('none');
      }
      return;
    }

    // Gráfico de pastel - Por categoría
    const categoriasSums = {};
    transacciones.forEach(t => {
      if (!categoriasSums[t.categoria]) categoriasSums[t.categoria] = 0;
      categoriasSums[t.categoria] += t.monto;
    });
    chartInstances.pie.data.labels = Object.keys(categoriasSums);
    chartInstances.pie.data.datasets[0].data = Object.values(categoriasSums);
    chartInstances.pie.update('none');

    // Gráfico de barras - Necesarios vs Innecesarios
    const necesarios = transacciones.filter(t => t.necesidad === 'Alta' || t.necesidad === 'Crítica').reduce((sum, t) => sum + t.monto, 0);
    const innecesarios = transacciones.filter(t => t.necesidad === 'Baja' || t.necesidad === 'Media').reduce((sum, t) => sum + t.monto, 0);
    chartInstances.bar.data.datasets[0].data = [necesarios, innecesarios];
    chartInstances.bar.update('none');

    // Gráfico de radar - Por necesidad
    const necesidadesSums = {};
    transacciones.forEach(t => {
      if (!necesidadesSums[t.necesidad]) necesidadesSums[t.necesidad] = 0;
      necesidadesSums[t.necesidad] += t.monto;
    });
    chartInstances.radar.data.labels = Object.keys(necesidadesSums);
    chartInstances.radar.data.datasets[0].data = Object.values(necesidadesSums);
    chartInstances.radar.update('none');

    // Gráfico lineal - Evolución diaria de gastos
    const diasSums = {};

    // Agrupar transacciones por fecha
    transacciones.forEach(t => {
      const fecha = t.fecha; // Formato YYYY-MM-DD
      if (!diasSums[fecha]) {
        diasSums[fecha] = 0;
      }
      diasSums[fecha] += t.monto;
    });

    // Ordenar fechas cronológicamente
    const sortedDates = Object.keys(diasSums).sort((a, b) => new Date(a) - new Date(b));

    // Formatear fechas para mejor visualización (DD/MM)
    const formattedLabels = sortedDates.map(fecha => {
      const date = new Date(fecha + 'T00:00:00'); // Evitar zona horaria
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
    });

    // Actualizar gráfico con datos diarios
    chartInstances.line.data.labels = formattedLabels;
    chartInstances.line.data.datasets[0].data = sortedDates.map(d => diasSums[d]);
    chartInstances.line.update('none');

    // Gráfico de balance (Doughnut) - Gastos vs Disponible
    if (chartInstances.balanceDoughnut) {
      const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
      const totalIngresos = usuario ? (usuario.ingresoBase + usuario.ingresoExtra + (usuario.ingresosAcumulados || 0)) : 0;
      const totalGastos = transacciones.reduce((sum, t) => sum + t.monto, 0);
      const disponible = Math.max(0, totalIngresos - totalGastos);

      chartInstances.balanceDoughnut.data.datasets[0].data = [totalGastos, disponible];
      chartInstances.balanceDoughnut.update('none');
    }

    // Gráfico de comparación por usuario
    if (chartInstances.userComparison) {
      const usuariosSums = {};
      transacciones.forEach(t => {
        if (!usuariosSums[t.usuario]) usuariosSums[t.usuario] = 0;
        usuariosSums[t.usuario] += t.monto;
      });

      chartInstances.userComparison.data.labels = Object.keys(usuariosSums);
      chartInstances.userComparison.data.datasets[0].data = Object.values(usuariosSums);
      chartInstances.userComparison.update('none');
    }
  } catch (error) {
    console.error('Error al actualizar gráficos:', error);
  }
}

// ============================================
// TRANSACCIONES
// ============================================

function updateTransacciones() {
  // Actualizar filtros
  const filterUsuario = document.getElementById('filterUsuario');
  filterUsuario.innerHTML = '<option value="">Todos</option>';
  appData.usuarios.forEach(user => {
    const option = document.createElement('option');
    option.value = user.nombre;
    option.textContent = user.nombre;
    filterUsuario.appendChild(option);
  });
  
  // Mostrar todas las transacciones
  renderTransacciones(appData.transacciones);
}

function renderTransacciones(transacciones) {
  const tbody = document.getElementById('transaccionesBody');
  tbody.innerHTML = '';
  
  if (transacciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hay transacciones registradas</td></tr>';
    return;
  }
  
  // Ordenar por fecha descendente
  const sorted = [...transacciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  sorted.forEach(t => {
    const tr = document.createElement('tr');
    const esRapido = t.esGastoRapido ? ' 🚀' : '';
    const tituloEditar = t.esGastoRapido ? 'Editar gasto rápido' : 'Editar monto';

    tr.innerHTML = `
      <td>${formatDate(t.fecha)}</td>
      <td>${sanitizeHTML(t.usuario)}</td>
      <td>${sanitizeHTML(t.descripcion)}${esRapido}</td>
      <td>${sanitizeHTML(t.categoria)}</td>
      <td>${sanitizeHTML(t.necesidad)}</td>
      <td><strong>${formatCLP(t.monto)}</strong></td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" data-action="editar" data-id="${t.id}" title="${tituloEditar}">✏️</button>
          <button class="btn-icon" data-action="eliminar" data-id="${t.id}" title="Eliminar">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function aplicarFiltros() {
  const fechaDesde = document.getElementById('filterFechaDesde').value;
  const fechaHasta = document.getElementById('filterFechaHasta').value;
  const montoMin = parseChileanNumber(document.getElementById('filterMontoMin').value) || 0;
  const montoMax = parseChileanNumber(document.getElementById('filterMontoMax').value) || Infinity;
  const categoria = document.getElementById('filterCategoria').value;
  const usuario = document.getElementById('filterUsuario').value;
  
  let filtered = [...appData.transacciones];
  
  if (fechaDesde) {
    filtered = filtered.filter(t => t.fecha >= fechaDesde);
  }
  
  if (fechaHasta) {
    filtered = filtered.filter(t => t.fecha <= fechaHasta);
  }
  
  filtered = filtered.filter(t => t.monto >= montoMin && t.monto <= montoMax);
  
  if (categoria) {
    filtered = filtered.filter(t => t.categoria === categoria);
  }
  
  if (usuario) {
    filtered = filtered.filter(t => t.usuario === usuario);
  }
  
  renderTransacciones(filtered);
}

function limpiarFiltros() {
  document.getElementById('filterFechaDesde').value = '';
  document.getElementById('filterFechaHasta').value = '';
  document.getElementById('filterMontoMin').value = '';
  document.getElementById('filterMontoMax').value = '';
  document.getElementById('filterCategoria').value = '';
  document.getElementById('filterUsuario').value = '';
  renderTransacciones(appData.transacciones);
}

function editarTransaccion(id) {
  const transaccion = appData.transacciones.find(t => t.id === id);
  if (!transaccion) return;

  // Si es un gasto rápido, abrir el modal de gasto rápido
  if (transaccion.esGastoRapido) {
    abrirModalEdicionRapida(transaccion);
  } else {
    // Para gastos normales, solo permitir editar el monto
    const nuevoMonto = prompt('Nuevo monto:', transaccion.monto);
    if (nuevoMonto && !isNaN(nuevoMonto)) {
      const montoAnterior = transaccion.monto;
      transaccion.monto = parseFloat(nuevoMonto);

      // Registrar en historial
      if (typeof window.registrarEnHistorial === 'function') {
        window.registrarEnHistorial('modificacion', `Monto modificado: ${transaccion.descripcion}`, {
          anterior: formatCLP(montoAnterior),
          nuevo: formatCLP(transaccion.monto)
        });
      }

      saveAppData();
      updateTransacciones();
      showToast('Transacción actualizada', 'success');
    }
  }
}

function abrirModalEdicionRapida(transaccion) {
  // Cambiar título del modal
  document.getElementById('modalRapidoTitle').textContent = '✏️ Editar Gasto Rápido';
  document.getElementById('btnGuardarRapido').textContent = 'Actualizar Gasto';

  // Llenar el formulario con los datos existentes
  document.getElementById('transaccionIdRapido').value = transaccion.id;
  document.getElementById('montoRapido').value = formatChileanNumber(transaccion.monto.toString());
  document.getElementById('descripcionRapido').value = transaccion.descripcion;
  document.getElementById('categoriaRapido').value = transaccion.categoria;
  document.getElementById('esGastoRapido').checked = transaccion.esGastoRapido !== false;

  // Mostrar el modal
  document.getElementById('modalRapido').classList.add('active');
}

// Función para resetear el modal al cerrarlo
function resetearModalRapido() {
  document.getElementById('modalRapidoTitle').textContent = '➕ Agregar Gasto Rápido';
  document.getElementById('btnGuardarRapido').textContent = 'Agregar Gasto';
  document.getElementById('transaccionIdRapido').value = '';
  document.getElementById('gastoRapidoForm').reset();
  document.getElementById('esGastoRapido').checked = true;
}

function eliminarTransaccion(id) {
  if (confirm('¿Estás seguro de eliminar esta transacción?')) {
    // Guardar info antes de eliminar para el historial
    const transaccion = appData.transacciones.find(t => t.id === id);

    appData.transacciones = appData.transacciones.filter(t => t.id !== id);

    // Registrar en historial
    if (transaccion && typeof window.registrarEnHistorial === 'function') {
      window.registrarEnHistorial('eliminacion', `Transacción eliminada: ${transaccion.descripcion}`, {
        monto: transaccion.monto,
        categoria: transaccion.categoria,
        necesidad: transaccion.necesidad
      });
    }

    saveAppData();
    updateTransacciones();
    updateUI();
    showToast('Transacción eliminada', 'success');
  }
}

// ============================================
// HISTORIAL
// ============================================

function updateHistorial() {
  const mesActual = getCurrentMonth();
  const mesAnterior = getPreviousMonth();
  
  // Mes actual
  const transaccionesMesActual = appData.transacciones.filter(t => t.mes === mesActual);
  renderHistorialMes('mesActualContent', 'resumenActual', transaccionesMesActual);
  
  // Mes anterior
  const transaccionesMesAnterior = appData.transacciones.filter(t => t.mes === mesAnterior);
  renderHistorialMes('mesAnteriorContent', 'resumenAnterior', transaccionesMesAnterior);
}

function renderHistorialMes(contentId, resumenId, transacciones) {
  const content = document.getElementById(contentId);
  const resumen = document.getElementById(resumenId);
  
  if (transacciones.length === 0) {
    content.innerHTML = '<p class="no-data">No hay datos para este mes</p>';
    resumen.innerHTML = '';
    return;
  }
  
  content.innerHTML = '';
  transacciones.forEach(t => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>${formatDate(t.fecha)}</strong> | ${t.usuario} | ${t.descripcion} | 
      ${t.categoria} | ${t.necesidad} | <strong>${formatCLP(t.monto)}</strong>
    `;
    content.appendChild(item);
  });
  
  // Resumen
  const totalIngresos = appData.usuarios.reduce((sum, u) => sum + u.ingresoBase + u.ingresoExtra, 0);
  const totalGastos = transacciones.reduce((sum, t) => sum + t.monto, 0);
  const balance = totalIngresos - totalGastos;
  
  resumen.innerHTML = `
    <p><strong>Total Ingresos:</strong> ${formatCLP(totalIngresos)}</p>
    <p><strong>Total Gastos:</strong> ${formatCLP(totalGastos)}</p>
    <p><strong>Balance Final:</strong> ${formatCLP(balance)}</p>
  `;
}

// ============================================
// EXPORTAR CSV
// ============================================

function exportarCSV() {
  try {
    if (appData.transacciones.length === 0) {
      showToast('No hay transacciones para exportar', 'error');
      return;
    }

    let csv = 'Fecha,Usuario,Descripción,Categoría,Necesidad,Monto,Items,Notas\n';

    appData.transacciones.forEach(t => {
      csv += `${t.fecha},${t.usuario},"${t.descripcion}",${t.categoria},${t.necesidad},${t.monto},"${t.items}","${t.notas}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finanzas_${getCurrentMonth()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Historial exportado correctamente', 'success');
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    showToast('Error al exportar el archivo', 'error');
  }
}

// ============================================
// CONFIGURACIÓN
// ============================================

function updateConfiguracion() {
  const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
  document.getElementById('configNombre').value = usuario.nombre;
  
  // Calcular tamaño de almacenamiento
  const size = new Blob([JSON.stringify(appData)]).size;
  document.getElementById('storageInfo').textContent = `${(size / 1024).toFixed(2)} KB`;
}

function handleFotoUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
      usuario.foto = event.target.result;
      saveAppData();
      updateUI();
      showToast('Foto actualizada', 'success');
    };
    reader.readAsDataURL(file);
  }
}

function guardarPerfil() {
  const nombre = document.getElementById('configNombre').value.trim();
  if (nombre) {
    const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
    usuario.nombre = nombre;
    updateUserSelects();
    saveAppData();
    updateUI();
    showToast('Perfil guardado correctamente', 'success');
  } else {
    showToast('El nombre no puede estar vacío', 'error');
  }
}

function reiniciarDatos() {
  if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
    if (confirm('Esta acción es IRREVERSIBLE. ¿Continuar?')) {
      appData.transacciones = [];
      appData.usuarios.forEach(u => {
        u.ingresoBase = 0;
        u.ingresoExtra = 0;
        u.foto = '';
      });
      saveAppData();
      updateUI();
      showToast('Todos los datos han sido eliminados', 'success');
      switchTab('registro');
    }
  }
}

// ============================================
// AUTOCOMPLETADO
// ============================================

function actualizarSugerencias() {
  // Obtener descripciones únicas del historial
  const descripciones = [...new Set(appData.transacciones.map(t => t.descripcion))];

  // Actualizar datalist del modal rápido
  const datalistRapido = document.getElementById('descripcionesSugeridas');
  datalistRapido.innerHTML = '';
  descripciones.forEach(desc => {
    const option = document.createElement('option');
    option.value = desc;
    datalistRapido.appendChild(option);
  });

  // Actualizar datalist del formulario principal
  const datalistPrincipal = document.getElementById('descripcionesSugeridasPrincipal');
  datalistPrincipal.innerHTML = '';
  descripciones.forEach(desc => {
    const option = document.createElement('option');
    option.value = desc;
    datalistPrincipal.appendChild(option);
  });
}

// ============================================
// UTILIDADES
// ============================================

function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

function formatCLP(amount) {
  return '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCurrentMonth() {
  const date = new Date();
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
}

function getPreviousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function updateUI() {
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    const tabId = activeTab.id;
    if (tabId === 'dashboard') updateDashboard();
    else if (tabId === 'transacciones') updateTransacciones();
    else if (tabId === 'historial') updateHistorial();
    else if (tabId === 'configuracion') updateConfiguracion();
  }

  // Actualizar ingresos en el formulario
  const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
  if (usuario) {
    document.getElementById('ingresoBase').value = usuario.ingresoBase ? formatChileanNumber(usuario.ingresoBase.toString()) : '';
    document.getElementById('ingresoExtra').value = usuario.ingresoExtra ? formatChileanNumber(usuario.ingresoExtra.toString()) : '';

    // Mostrar panel de ingresos acumulados si hay ingresos
    const panelAcumulados = document.getElementById('ingresosAgregados');
    if (usuario.ingresosAcumulados && usuario.ingresosAcumulados > 0) {
      panelAcumulados.style.display = 'block';
      document.getElementById('totalIngresosAcumulados').textContent = formatCLP(usuario.ingresosAcumulados);
    } else {
      panelAcumulados.style.display = 'none';
    }
  }
}

// ============================================
// MODAL DE AUTENTICACIÓN
// ============================================

// Variable para rastrear si el modal ya fue inicializado
let authModalInitialized = false;

function showAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.add('active');

  // Solo configurar event listeners la primera vez
  if (!authModalInitialized) {
    // Setup tabs
    const authTabs = document.querySelectorAll('.auth-tab');

    authTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remover active de todos
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        // Activar el seleccionado
        this.classList.add('active');
        const tabName = this.dataset.authTab;
        const formElement = document.getElementById(`${tabName}Form`);

        if (formElement) {
          formElement.classList.add('active');
        }
      });
    });

    // Form de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Form de registro
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Botón de continuar anónimo
    document.getElementById('continueAnonymous').addEventListener('click', handleContinueAnonymous);

    // Toggle password visibility
    setupPasswordToggles();

    authModalInitialized = true;
  }

  // Cargar credenciales guardadas si existen
  loadSavedCredentials();
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password');

  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const passwordInput = document.getElementById(targetId);
      const eyeIcon = this.querySelector('.eye-icon');

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
        this.title = 'Ocultar contraseña';
      } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
        this.title = 'Mostrar contraseña';
      }
    });
  });
}

function hideAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function loadSavedCredentials() {
  try {
    const savedCreds = localStorage.getItem('rememberedCredentials');
    if (savedCreds) {
      const { email, rememberMe } = JSON.parse(savedCreds);
      document.getElementById('loginEmail').value = email;
      document.getElementById('rememberMe').checked = rememberMe;
    }

    // Si hay una sesión guardada, intentar login automático
    const autoLogin = localStorage.getItem('autoLogin');
    if (autoLogin === 'true') {
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        // Ocultar modal y cargar datos directamente
        setTimeout(() => {
          hideAuthModal();
          initializeAppAfterAuth();
        }, 500);
      }
    }
  } catch (error) {
    console.error('Error al cargar credenciales guardadas:', error);
  }
}

function saveCredentials(email, rememberMe) {
  try {
    if (rememberMe) {
      localStorage.setItem('rememberedCredentials', JSON.stringify({
        email,
        rememberMe: true
      }));
      localStorage.setItem('autoLogin', 'true');
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('rememberedCredentials');
      localStorage.removeItem('autoLogin');
      localStorage.removeItem('userEmail');
    }
  } catch (error) {
    console.error('Error al guardar credenciales:', error);
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  if (!email || !password) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  showToast('Iniciando sesión...', 'info');

  const result = await loginWithEmail(email, password);

  if (result.success) {
    // Guardar credenciales si el usuario lo solicita
    saveCredentials(email, rememberMe);

    showToast('¡Bienvenido de nuevo!', 'success');
    hideAuthModal();
    await initializeAppAfterAuth();
  } else {
    showToast(getErrorMessage(result.error), 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const rememberMe = document.getElementById('rememberMeRegister').checked;

  if (!name || !email || !password || !passwordConfirm) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  if (password !== passwordConfirm) {
    showToast('Las contraseñas no coinciden', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  showToast('Creando cuenta...', 'info');

  const result = await registerWithEmail(email, password, name);

  if (result.success) {
    // Guardar credenciales si el usuario lo solicita
    saveCredentials(email, rememberMe);

    showToast(`¡Bienvenido ${name}!`, 'success');
    hideAuthModal();
    await initializeAppAfterAuth();
  } else {
    showToast(getErrorMessage(result.error), 'error');
  }
}

async function handleContinueAnonymous() {
  showToast('Conectando...', 'info');

  const result = await continueAnonymously();

  if (result.success) {
    showToast('Modo invitado activado', 'success');
    hideAuthModal();
    await initializeAppAfterAuth();
  } else {
    showToast('Error al conectar. Intenta de nuevo.', 'error');
  }
}

async function initializeAppAfterAuth() {
  try {
    await initializeFirebaseAuth();
    await initializeApp();
    setupEventListeners();
    updateUI();
  } catch (error) {
    console.error('Error después de autenticar:', error);
    showToast('Error al cargar la aplicación', 'error');
  }
}

function getErrorMessage(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'Email inválido',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/weak-password': 'La contraseña es muy débil',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
  };

  // Buscar el código de error
  for (const [code, message] of Object.entries(errorMessages)) {
    if (error.includes(code)) {
      return message;
    }
  }

  return 'Error al autenticar. Intenta de nuevo.';
}