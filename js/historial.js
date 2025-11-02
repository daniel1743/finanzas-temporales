// ============================================
// SISTEMA DE HISTORIAL COMPLETO
// ============================================

/**
 * Registra una acción en el historial
 * @param {string} tipo - Tipo de acción: 'ingreso', 'gasto', 'modificacion', 'eliminacion'
 * @param {string} descripcion - Descripción de la acción
 * @param {object} detalles - Detalles adicionales de la acción
 */
function registrarEnHistorial(tipo, descripcion, detalles = {}) {
    try {
        // Verificar que window.appData existe
        if (!window.appData) {
            console.error('❌ window.appData no está definido');
            return;
        }

        // Inicializar historial si no existe
        if (!window.appData.historial) {
            window.appData.historial = [];
            console.log('✅ Historial inicializado');
        }

        const entrada = {
            id: Date.now(), // ID único basado en timestamp
            fecha: new Date().toISOString(),
            tipo: tipo, // 'ingreso', 'gasto', 'modificacion', 'eliminacion'
            descripcion: descripcion,
            detalles: detalles,
            usuario: window.appData?.usuarioActual || 1,
            nombreUsuario: window.appData?.usuarios?.find(u => u.id === window.appData.usuarioActual)?.nombre || 'Usuario'
        };

        // Agregar al inicio del array (más reciente primero)
        window.appData.historial.unshift(entrada);

        // Limitar a las últimas 500 entradas para no saturar
        if (window.appData.historial.length > 500) {
            window.appData.historial = window.appData.historial.slice(0, 500);
        }

        console.log('📝 Registrado en historial:', tipo, descripcion);

        // Actualizar historial completo si está visible
        if (document.querySelector('#historial.tab-content.active')) {
            renderHistorialCompleto();
        }

        // SIEMPRE actualizar el mini historial del dashboard
        actualizarMiniHistorial();

        // Guardar cambios
        if (typeof saveAppData === 'function') {
            saveAppData();
        }

    } catch (error) {
        console.error('Error al registrar en historial:', error);
    }
}

/**
 * Actualiza la visualización del historial
 */
function actualizarVistaHistorial() {
    console.log('🔄 Actualizando vista de historial...');

    const historial = window.appData?.historial || [];

    // Agrupar por mes
    const historialPorMes = agruparHistorialPorMes(historial);

    // Renderizar mes actual
    renderizarHistorialMes('mesActualContent', 'resumenActual', historialPorMes.mesActual, 'Mes Actual');

    // Renderizar mes anterior
    renderizarHistorialMes('mesAnteriorContent', 'resumenAnterior', historialPorMes.mesAnterior, 'Mes Anterior');
}

/**
 * Agrupa el historial por mes
 */
function agruparHistorialPorMes(historial) {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

    return {
        mesActual: historial.filter(h => {
            const fecha = new Date(h.fecha);
            return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
        }),
        mesAnterior: historial.filter(h => {
            const fecha = new Date(h.fecha);
            return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoAnterior;
        }),
        todoElHistorial: historial
    };
}

/**
 * Renderiza el historial de un mes específico
 */
function renderizarHistorialMes(contentId, resumenId, entradas, titulo) {
    const contentContainer = document.getElementById(contentId);
    const resumenContainer = document.getElementById(resumenId);

    if (!contentContainer) return;

    if (entradas.length === 0) {
        contentContainer.innerHTML = '<p class="no-data">No hay registros en ' + titulo + '</p>';
        if (resumenContainer) {
            resumenContainer.innerHTML = '';
        }
        return;
    }

    // Calcular resumen
    const resumen = calcularResumenHistorial(entradas);

    // Renderizar resumen
    if (resumenContainer) {
        resumenContainer.innerHTML = `
            <div class="historial-resumen">
                <div class="resumen-item">
                    <span class="resumen-label">💰 Total Ingresos:</span>
                    <span class="resumen-value ingreso">${formatCLP(resumen.totalIngresos)}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">💸 Total Gastos:</span>
                    <span class="resumen-value gasto">${formatCLP(resumen.totalGastos)}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">📊 Total Acciones:</span>
                    <span class="resumen-value">${entradas.length}</span>
                </div>
            </div>
        `;
    }

    // Renderizar entradas
    let html = '<div class="historial-lista">';

    entradas.forEach(entrada => {
        const fecha = new Date(entrada.fecha);
        const fechaFormateada = fecha.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const iconoTipo = {
            'ingreso': '💰',
            'gasto': '💸',
            'modificacion': '✏️',
            'eliminacion': '🗑️'
        }[entrada.tipo] || '📝';

        const claseTipo = entrada.tipo;

        html += `
            <div class="historial-entrada ${claseTipo}">
                <div class="historial-icono">${iconoTipo}</div>
                <div class="historial-info">
                    <div class="historial-header">
                        <span class="historial-tipo">${entrada.tipo.toUpperCase()}</span>
                        <span class="historial-fecha">${fechaFormateada}</span>
                    </div>
                    <div class="historial-descripcion">${entrada.descripcion}</div>
                    ${renderizarDetallesHistorial(entrada.detalles)}
                    <div class="historial-usuario">Por: ${entrada.nombreUsuario}</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contentContainer.innerHTML = html;
}

/**
 * Renderiza los detalles de una entrada del historial
 */
function renderizarDetallesHistorial(detalles) {
    if (!detalles || Object.keys(detalles).length === 0) return '';

    let html = '<div class="historial-detalles">';

    if (detalles.monto) {
        html += `<span class="detalle-monto">${formatCLP(detalles.monto)}</span>`;
    }

    if (detalles.categoria) {
        html += `<span class="detalle-categoria">${detalles.categoria}</span>`;
    }

    if (detalles.necesidad) {
        html += `<span class="detalle-necesidad">${detalles.necesidad}</span>`;
    }

    if (detalles.anterior && detalles.nuevo) {
        html += `<span class="detalle-cambio">${detalles.anterior} → ${detalles.nuevo}</span>`;
    }

    html += '</div>';
    return html;
}

/**
 * Calcula el resumen del historial
 */
function calcularResumenHistorial(entradas) {
    let totalIngresos = 0;
    let totalGastos = 0;

    entradas.forEach(entrada => {
        if (entrada.tipo === 'ingreso' && entrada.detalles.monto) {
            totalIngresos += entrada.detalles.monto;
        } else if (entrada.tipo === 'gasto' && entrada.detalles.monto) {
            totalGastos += entrada.detalles.monto;
        }
    });

    return {
        totalIngresos,
        totalGastos,
        balance: totalIngresos - totalGastos
    };
}

/**
 * Exporta el historial a CSV
 */
function exportarHistorialCSV() {
    console.log('📥 Exportando historial a CSV...');

    const historial = window.appData?.historial || [];

    if (historial.length === 0) {
        if (typeof showToast === 'function') {
            showToast('No hay datos para exportar', 'warning');
        } else {
            alert('No hay datos para exportar');
        }
        return;
    }

    // Crear encabezados CSV
    let csv = 'Fecha,Tipo,Descripción,Monto,Categoría,Necesidad,Usuario\n';

    // Agregar filas
    historial.forEach(entrada => {
        const fecha = new Date(entrada.fecha).toLocaleString('es-CL');
        const tipo = entrada.tipo;
        const descripcion = entrada.descripcion.replace(/,/g, ';'); // Reemplazar comas
        const monto = entrada.detalles.monto || '';
        const categoria = entrada.detalles.categoria || '';
        const necesidad = entrada.detalles.necesidad || '';
        const usuario = entrada.nombreUsuario;

        csv += `${fecha},${tipo},"${descripcion}",${monto},${categoria},${necesidad},${usuario}\n`;
    });

    // Crear y descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `historial_finanzas_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Historial exportado correctamente');

    if (typeof showToast === 'function') {
        showToast('✅ Historial exportado correctamente', 'success');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Configurar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de historial...');

    // Botón de exportar CSV
    const btnExportar = document.getElementById('exportarCSV');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarHistorialCSV);
    }

    // Actualizar historial completo cuando se active el tab
    const tabHistorial = document.querySelector('[data-tab="historial"]');
    if (tabHistorial) {
        tabHistorial.addEventListener('click', () => {
            setTimeout(renderHistorialCompleto, 100);
        });
    }

    // Filtro de tipo
    const filtroTipo = document.getElementById('filtroTipoHistorial');
    if (filtroTipo) {
        filtroTipo.addEventListener('change', aplicarFiltrosHistorial);
    }

    // Botón limpiar filtros
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltrosHistorial');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltrosHistorial);
    }

    console.log('✅ Sistema de historial inicializado');
});

/**
 * Actualiza el mini historial en el dashboard (últimos 10 movimientos)
 */
function actualizarMiniHistorial() {
    console.log('🔄 Actualizando mini historial en dashboard...');

    const historial = window.appData?.historial || [];
    const miniHistorialContainer = document.getElementById('miniHistorial');
    const resumenElement = document.getElementById('ultimosMovimientosResumen');

    if (!miniHistorialContainer) {
        console.warn('⚠️ Contenedor miniHistorial no encontrado');
        return;
    }

    // Tomar los últimos 10 movimientos
    const ultimos10 = historial.slice(0, 10);

    if (ultimos10.length === 0) {
        miniHistorialContainer.innerHTML = '<p class="no-data">No hay movimientos registrados</p>';
        if (resumenElement) {
            resumenElement.textContent = 'Sin movimientos';
        }
        return;
    }

    // Actualizar resumen
    if (resumenElement) {
        const ultimo = ultimos10[0];
        const iconoTipo = {
            'ingreso': '💰',
            'gasto': '💸',
            'modificacion': '✏️',
            'eliminacion': '🗑️'
        }[ultimo.tipo] || '📝';

        resumenElement.textContent = `${iconoTipo} ${ultimos10.length} movimiento${ultimos10.length > 1 ? 's' : ''} reciente${ultimos10.length > 1 ? 's' : ''}`;
    }

    // Renderizar mini historial
    let html = '';

    ultimos10.forEach(entrada => {
        const fecha = new Date(entrada.fecha);
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let fechaRelativa;
        if (diffMins < 1) {
            fechaRelativa = 'Justo ahora';
        } else if (diffMins < 60) {
            fechaRelativa = `Hace ${diffMins} min`;
        } else if (diffHours < 24) {
            fechaRelativa = `Hace ${diffHours}h`;
        } else if (diffDays === 1) {
            fechaRelativa = 'Ayer';
        } else if (diffDays < 7) {
            fechaRelativa = `Hace ${diffDays} días`;
        } else {
            fechaRelativa = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
        }

        const iconoTipo = {
            'ingreso': '💰',
            'gasto': '💸',
            'modificacion': '✏️',
            'eliminacion': '🗑️'
        }[entrada.tipo] || '📝';

        const claseTipo = entrada.tipo;

        // Obtener monto si existe
        let montoHTML = '';
        if (entrada.detalles?.monto) {
            montoHTML = `<div class="mini-monto">${formatCLP(entrada.detalles.monto)}</div>`;
        }

        html += `
            <div class="mini-historial-entrada ${claseTipo}">
                <div class="mini-icono">${iconoTipo}</div>
                <div class="mini-info">
                    <div class="mini-descripcion">${entrada.descripcion}</div>
                    ${montoHTML}
                </div>
                <div class="mini-fecha">${fechaRelativa}</div>
            </div>
        `;
    });

    miniHistorialContainer.innerHTML = html;
    console.log('✅ Mini historial actualizado con', ultimos10.length, 'movimientos');
}

/**
 * Renderiza el historial completo (sin límite)
 * Muestra TODOS los movimientos registrados, ordenados del más reciente al más antiguo
 */
function renderHistorialCompleto(filtroTipo = '') {
    console.log('🔄 Renderizando historial completo...');

    const historial = window.appData?.historial || [];
    const listaContainer = document.getElementById('listaHistorialCompleto');
    const resumenContainer = document.getElementById('resumenHistorialCompleto');

    if (!listaContainer) {
        console.warn('⚠️ Contenedor listaHistorialCompleto no encontrado');
        return;
    }

    // Filtrar por tipo si es necesario
    let historialFiltrado = historial;
    if (filtroTipo) {
        historialFiltrado = historial.filter(h => h.tipo === filtroTipo);
    }

    // Verificar si hay datos
    if (historialFiltrado.length === 0) {
        listaContainer.innerHTML = '<p class="no-data">No hay movimientos registrados</p>';
        if (resumenContainer) {
            resumenContainer.innerHTML = '';
        }
        return;
    }

    // Calcular resumen por tipo
    const resumen = {
        ingreso: { count: 0, total: 0 },
        gasto: { count: 0, total: 0 },
        modificacion: { count: 0, total: 0 },
        eliminacion: { count: 0, total: 0 }
    };

    historialFiltrado.forEach(entrada => {
        if (resumen[entrada.tipo]) {
            resumen[entrada.tipo].count++;
            if (entrada.detalles?.monto) {
                resumen[entrada.tipo].total += entrada.detalles.monto;
            }
        }
    });

    // Renderizar resumen
    if (resumenContainer) {
        let resumenHTML = '';

        if (resumen.ingreso.count > 0) {
            resumenHTML += `
                <div class="resumen-card ingreso">
                    <h4>💰 Ingresos</h4>
                    <div class="valor">${resumen.ingreso.count}</div>
                    <small>${formatCLP(resumen.ingreso.total)}</small>
                </div>
            `;
        }

        if (resumen.gasto.count > 0) {
            resumenHTML += `
                <div class="resumen-card gasto">
                    <h4>💸 Gastos</h4>
                    <div class="valor">${resumen.gasto.count}</div>
                    <small>${formatCLP(resumen.gasto.total)}</small>
                </div>
            `;
        }

        if (resumen.modificacion.count > 0) {
            resumenHTML += `
                <div class="resumen-card modificacion">
                    <h4>✏️ Modificaciones</h4>
                    <div class="valor">${resumen.modificacion.count}</div>
                </div>
            `;
        }

        if (resumen.eliminacion.count > 0) {
            resumenHTML += `
                <div class="resumen-card eliminacion">
                    <h4>🗑️ Eliminaciones</h4>
                    <div class="valor">${resumen.eliminacion.count}</div>
                </div>
            `;
        }

        resumenContainer.innerHTML = resumenHTML;
    }

    // Renderizar lista completa (más reciente primero - el array ya está invertido)
    let html = '';

    historialFiltrado.forEach(entrada => {
        const fecha = new Date(entrada.fecha);
        const fechaFormateada = fecha.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const iconoTipo = {
            'ingreso': '💰',
            'gasto': '💸',
            'modificacion': '✏️',
            'eliminacion': '🗑️'
        }[entrada.tipo] || '📝';

        const claseTipo = entrada.tipo;

        html += `
            <div class="historial-entrada ${claseTipo}">
                <div class="historial-icono">${iconoTipo}</div>
                <div class="historial-info">
                    <div class="historial-header">
                        <span class="historial-tipo">${entrada.tipo.toUpperCase()}</span>
                        <span class="historial-fecha">${fechaFormateada}</span>
                    </div>
                    <div class="historial-descripcion">${entrada.descripcion}</div>
                    ${renderizarDetallesHistorial(entrada.detalles)}
                    <div class="historial-usuario">Por: ${entrada.nombreUsuario}</div>
                </div>
            </div>
        `;
    });

    listaContainer.innerHTML = html;
    console.log('✅ Historial completo renderizado:', historialFiltrado.length, 'movimientos');
}

/**
 * Aplica filtros al historial completo
 */
function aplicarFiltrosHistorial() {
    const filtroTipo = document.getElementById('filtroTipoHistorial')?.value || '';
    renderHistorialCompleto(filtroTipo);
}

/**
 * Limpia los filtros del historial completo
 */
function limpiarFiltrosHistorial() {
    const filtroTipo = document.getElementById('filtroTipoHistorial');
    if (filtroTipo) {
        filtroTipo.value = '';
    }
    renderHistorialCompleto();
}

// Exponer funciones globalmente
window.registrarEnHistorial = registrarEnHistorial;
window.actualizarVistaHistorial = actualizarVistaHistorial;
window.actualizarMiniHistorial = actualizarMiniHistorial;
window.renderHistorialCompleto = renderHistorialCompleto;
window.aplicarFiltrosHistorial = aplicarFiltrosHistorial;
window.limpiarFiltrosHistorial = limpiarFiltrosHistorial;
window.exportarHistorialCSV = exportarHistorialCSV;
