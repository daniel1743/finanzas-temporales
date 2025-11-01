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
  usuarioActual: 1,
  mesActual: '',
  configuracion: {}
};

let chartInstances = {};
let selectedNecesidad = '';
let useFirebase = true; // Toggle para usar Firebase o localStorage

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Mostrar modal de autenticación primero
    showAuthModal();

    // Inicializar Firebase sin autenticar aún
    // La autenticación se hará cuando el usuario elija en el modal
  } catch (error) {
    console.error('Error al inicializar:', error);
    showToast('Error al iniciar la aplicación', 'error');
  }
});

function initializeApp() {
  // Cargar o inicializar datos desde variables en memoria
  loadAppData();
  
  // Configurar fecha actual por defecto
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fechaGasto').value = today;
  
  // Actualizar mes actual
  appData.mesActual = getCurrentMonth();
  
  // Inicializar gráficos
  initializeCharts();
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
      { id: 1, nombre: 'Daniel', foto: '', ingresoBase: 0, ingresoExtra: 0 },
      { id: 2, nombre: 'Pareja', foto: '', ingresoBase: 0, ingresoExtra: 0 }
    ];
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
      const newUser = {
        id: appData.usuarios.length + 1,
        nombre: nombre.trim(),
        foto: '',
        ingresoBase: 0,
        ingresoExtra: 0
      };
      appData.usuarios.push(newUser);
      appData.usuarioActual = newUser.id;
      updateUserSelects();
      saveAppData();
      showToast('Usuario agregado correctamente', 'success');
    } else {
      e.target.value = appData.usuarioActual;
    }
  } else {
    appData.usuarioActual = parseInt(value);
    saveAppData();
  }
  
  updateUI();
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

  try {
    // Validar campos obligatorios
    const montoGasto = parseFloat(document.getElementById('montoGasto').value);
    const descripcion = document.getElementById('descripcionGasto').value.trim();
    const categoria = document.getElementById('categoria').value;
    const fecha = document.getElementById('fechaGasto').value;
    const usuario = document.getElementById('usuarioGasto').value;

    if (!montoGasto || montoGasto <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
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
    saveAppData();

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
  const ingresoBase = parseFloat(document.getElementById('ingresoBase').value) || 0;
  const ingresoExtra = parseFloat(document.getElementById('ingresoExtra').value) || 0;
  
  const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);
  if (usuario) {
    usuario.ingresoBase = ingresoBase;
    usuario.ingresoExtra = ingresoExtra;
    saveAppData();
    updateUI();
  }
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
    const monto = parseFloat(document.getElementById('montoRapido').value);
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
        transaccion.monto = monto;
        transaccion.descripcion = descripcion;
        transaccion.categoria = categoria;
        transaccion.esGastoRapido = esGastoRapido;

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
  try {
    const usuario = appData.usuarios.find(u => u.id === appData.usuarioActual);

    if (!usuario) {
      showToast('Usuario no encontrado', 'error');
      return;
    }

    // Actualizar perfil
    document.getElementById('userGreeting').textContent = `Hola, ${usuario.nombre} 👋`;
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const currentDate = new Date();
    const monthName = monthNames[currentDate.getMonth()];
    document.getElementById('monthInfo').textContent = `Tus finanzas de ${monthName} van así:`;

    if (usuario.foto) {
      document.getElementById('userAvatar').src = usuario.foto;
    }

    // Calcular totales
    const transaccionesMes = appData.transacciones.filter(t => t.mes === getCurrentMonth());
    const totalIngresos = usuario.ingresoBase + usuario.ingresoExtra;
    const totalGastos = transaccionesMes.reduce((sum, t) => sum + t.monto, 0);
    const balance = totalIngresos - totalGastos;

    // Actualizar tarjetas
    document.getElementById('balanceGeneral').textContent = formatCLP(balance);
    document.getElementById('ingresosTotal').textContent = formatCLP(totalIngresos);
    document.getElementById('gastosTotal').textContent = formatCLP(totalGastos);
    document.getElementById('totalGastado').textContent = formatCLP(totalGastos);
    document.getElementById('loQueQueda').textContent = formatCLP(balance);

    // Actualizar detalles de gastos por categoría
    const gastadoPorCategoria = document.getElementById('gastadoPorCategoria');
    gastadoPorCategoria.innerHTML = '';
    const categoriasSums = {};
    transaccionesMes.forEach(t => {
      if (!categoriasSums[t.categoria]) categoriasSums[t.categoria] = 0;
      categoriasSums[t.categoria] += t.monto;
    });
    Object.entries(categoriasSums).forEach(([cat, sum]) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${sanitizeHTML(cat)}:</strong> ${formatCLP(sum)}`;
      gastadoPorCategoria.appendChild(p);
    });

    // Actualizar barra de progreso
    const porcentajeUsado = totalIngresos > 0 ? (totalGastos / totalIngresos * 100) : 0;
    document.getElementById('progressFill').style.width = `${Math.min(porcentajeUsado, 100)}%`;
    document.getElementById('progressText').textContent = `${porcentajeUsado.toFixed(1)}% del presupuesto utilizado`;

    // Actualizar gráficos
    updateCharts(transaccionesMes);
  } catch (error) {
    console.error('Error al actualizar dashboard:', error);
    showToast('Error al cargar el dashboard', 'error');
  }
}

// ============================================
// GRÁFICOS
// ============================================

function initializeCharts() {
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
  
  // Gráfico de pastel - Gastos por categoría
  const ctxPie = document.getElementById('chartPie').getContext('2d');
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
      chartInstances.pie.update('none'); // 'none' evita animaciones innecesarias

      chartInstances.bar.data.datasets[0].data = [0, 0];
      chartInstances.bar.update('none');

      chartInstances.radar.data.labels = [];
      chartInstances.radar.data.datasets[0].data = [];
      chartInstances.radar.update('none');

      chartInstances.line.data.labels = [];
      chartInstances.line.data.datasets[0].data = [];
      chartInstances.line.update('none');
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

    // Gráfico lineal - Evolución diaria
    const diasSums = {};
    transacciones.forEach(t => {
      if (!diasSums[t.fecha]) diasSums[t.fecha] = 0;
      diasSums[t.fecha] += t.monto;
    });
    const sortedDates = Object.keys(diasSums).sort();
    chartInstances.line.data.labels = sortedDates;
    chartInstances.line.data.datasets[0].data = sortedDates.map(d => diasSums[d]);
    chartInstances.line.update('none');
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
  const montoMin = parseFloat(document.getElementById('filterMontoMin').value) || 0;
  const montoMax = parseFloat(document.getElementById('filterMontoMax').value) || Infinity;
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
      transaccion.monto = parseFloat(nuevoMonto);
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
  document.getElementById('montoRapido').value = transaccion.monto;
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
    appData.transacciones = appData.transacciones.filter(t => t.id !== id);
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
    document.getElementById('ingresoBase').value = usuario.ingresoBase || '';
    document.getElementById('ingresoExtra').value = usuario.ingresoExtra || '';
  }
}

// ============================================
// MODAL DE AUTENTICACIÓN
// ============================================

function showAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.add('active');

  // Setup tabs
  const authTabs = document.querySelectorAll('.auth-tab');
  authTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remover active de todos
      authTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

      // Activar el seleccionado
      this.classList.add('active');
      const tabName = this.dataset.authTab;
      document.getElementById(`${tabName}Form`).classList.add('active');
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

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  showToast('Iniciando sesión...', 'info');

  const result = await loginWithEmail(email, password);

  if (result.success) {
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