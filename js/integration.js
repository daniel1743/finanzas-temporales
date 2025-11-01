// ============================================
// INTEGRACIÓN - Conecta currency-notifications.js con app.js
// ============================================

/**
 * Inicializa todas las funcionalidades de notificaciones y moneda
 */
function initializeEnhancements() {
  setupNotificationHandlers();
  setupCurrencyFormatting();
  setupSmartInsights();
  console.log('✅ Mejoras de CLP y notificaciones inicializadas');
}

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

function setupNotificationHandlers() {
  // Botón para habilitar notificaciones
  const enableNotificationsCheckbox = document.getElementById('enableNotifications');
  const saveNotificationSettingsBtn = document.getElementById('saveNotificationSettings');
  const testNotificationBtn = document.getElementById('testNotification');
  const reminderTimeInput = document.getElementById('reminderTime');

  // Verificar estado inicial
  if (enableNotificationsCheckbox) {
    enableNotificationsCheckbox.checked = window.notificationManager?.notificationsEnabled || false;
  }

  // Cargar hora guardada
  const savedTime = localStorage.getItem('reminderTime');
  if (savedTime && reminderTimeInput) {
    reminderTimeInput.value = savedTime;
  }

  // Handler para checkbox de notificaciones
  if (enableNotificationsCheckbox) {
    enableNotificationsCheckbox.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const granted = await window.notificationManager.requestPermission();
        if (!granted) {
          e.target.checked = false;
          alert('❌ Permisos de notificación denegados. Por favor, habilítalos en la configuración de tu navegador.');
        } else {
          showToast('✅ Notificaciones habilitadas correctamente', 'success');
        }
      } else {
        window.notificationManager.notificationsEnabled = false;
        showToast('🔕 Notificaciones deshabilitadas', 'info');
      }
    });
  }

  // Handler para guardar configuración
  if (saveNotificationSettingsBtn) {
    saveNotificationSettingsBtn.addEventListener('click', () => {
      const time = reminderTimeInput.value;
      if (time) {
        window.notificationManager.setReminderTime(time);
        showToast('⏰ Configuración guardada correctamente', 'success');

        // Si las notificaciones están habilitadas, reprogramar
        if (window.notificationManager.notificationsEnabled) {
          window.notificationManager.scheduleDailyReminder();
        }
      }
    });
  }

  // Handler para probar notificación
  if (testNotificationBtn) {
    testNotificationBtn.addEventListener('click', async () => {
      if (!window.notificationManager.notificationsEnabled) {
        const granted = await window.notificationManager.requestPermission();
        if (!granted) {
          alert('❌ Necesitas habilitar las notificaciones primero');
          return;
        }
      }

      window.notificationManager.send('💰 Notificación de Prueba', {
        body: 'Las notificaciones están funcionando correctamente 🎉',
        icon: '/public/icon-192.png'
      });
      showToast('🔔 Notificación de prueba enviada', 'success');
    });
  }
}

// ============================================
// FORMATEO DE MONEDA CLP
// ============================================

function setupCurrencyFormatting() {
  // Override de funciones globales para usar CLP
  if (typeof window.formatCurrency === 'undefined') {
    window.formatCurrency = window.formatCLP;
  }

  // Convertir todos los elementos existentes con clase money
  document.querySelectorAll('.money, [data-currency]').forEach(element => {
    const value = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
    element.textContent = window.formatCLP(value);
  });

  // Observer para detectar cambios dinámicos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.classList?.contains('money') || node.hasAttribute?.('data-currency')) {
              const value = parseFloat(node.textContent.replace(/[^0-9.-]/g, '')) || 0;
              node.textContent = window.formatCLP(value);
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// ============================================
// RECOMENDACIONES INTELIGENTES
// ============================================

function setupSmartInsights() {
  // Esta función se llama cuando se actualizan las transacciones
  window.updateSmartInsights = function(transactions) {
    if (!transactions || transactions.length === 0) {
      return;
    }

    // Analizar gastos
    const insights = window.smartInsights.analyzeSpending(transactions);

    // Renderizar insights
    window.smartInsights.renderInsights('smartInsightsContainer');

    // Si hay alertas importantes, enviar notificación
    const criticalInsights = insights.filter(i => i.severity === 'warning' || i.severity === 'error');
    if (criticalInsights.length > 0 && window.notificationManager.notificationsEnabled) {
      const firstCritical = criticalInsights[0];
      window.notificationManager.send(
        `${firstCritical.icon} ${firstCritical.title}`,
        {
          body: firstCritical.message,
          icon: '/public/icon-192.png',
          tag: 'insight-alert'
        }
      );
    }
  };
}

// ============================================
// UTILIDADES DE FORMATO MEJORADAS
// ============================================

/**
 * Formatea inputs de moneda mientras el usuario escribe
 * @param {HTMLInputElement} input - Input a formatear
 */
function setupCurrencyInput(input) {
  input.addEventListener('blur', (e) => {
    const value = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
    e.target.value = value; // Mantener como número para el formulario
  });

  input.addEventListener('focus', (e) => {
    // Limpiar formato al enfocar
    const value = e.target.value.replace(/[^0-9.-]/g, '');
    e.target.value = value;
  });
}

/**
 * Aplica formateo de moneda a todos los inputs type="number" para montos
 */
function applyInputFormatting() {
  const moneyInputs = document.querySelectorAll('#montoGasto, #ingresoBase, #ingresoExtra, #montoRapido, #filterMontoMin, #filterMontoMax, #amount');

  moneyInputs.forEach(input => {
    if (input) {
      // Agregar símbolo de pesos en el placeholder
      if (input.placeholder && !input.placeholder.includes('$')) {
        input.placeholder = '$' + (input.placeholder || '0');
      }

      setupCurrencyInput(input);
    }
  });
}

// ============================================
// MOSTRAR TOAST (utilidad)
// ============================================

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  toast.textContent = message;
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Hacer disponible globalmente
window.showToast = showToast;

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeEnhancements, 500); // Esperar a que app.js se cargue
  });
} else {
  setTimeout(initializeEnhancements, 500);
}

// También inicializar cuando cambie de tab al dashboard
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-tab="dashboard"]')) {
    setTimeout(() => {
      // Actualizar insights si hay transacciones
      if (typeof appData !== 'undefined' && appData.transacciones) {
        window.updateSmartInsights?.(appData.transacciones);
      }
    }, 100);
  }
});

// Exportar funciones principales
export {
  initializeEnhancements,
  setupNotificationHandlers,
  setupCurrencyFormatting,
  setupSmartInsights,
  applyInputFormatting,
  showToast
};
