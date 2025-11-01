// ============================================
// MONEDA CLP CHILE Y NOTIFICACIONES INTELIGENTES
// ============================================

// ============================================
// 1. FORMATEADOR DE MONEDA CLP
// ============================================

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/**
 * Formatea un número a formato de moneda chilena (CLP)
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado (ej: "$1.500")
 */
function formatCLP(amount) {
  return currencyFormatter.format(amount);
}

/**
 * Parsea un string de moneda CLP a número
 * @param {string} clpString - String con formato CLP
 * @returns {number} Número parseado
 */
function parseCLP(clpString) {
  return parseInt(clpString.replace(/[$.]/g, '').replace(/\s/g, '')) || 0;
}

/**
 * Actualiza todos los elementos de moneda en la página
 */
function updateAllCurrencyDisplays() {
  document.querySelectorAll('[data-currency]').forEach(element => {
    const amount = parseFloat(element.dataset.currency) || 0;
    element.textContent = formatCLP(amount);
  });
}

// ============================================
// 2. SISTEMA DE NOTIFICACIONES
// ============================================

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.notificationsEnabled = false;
    this.reminderTime = '20:00'; // Hora por defecto para recordatorios
    this.lastNotification = null;
  }

  /**
   * Solicita permiso para enviar notificaciones
   */
  async requestPermission() {
    if ('Notification' in window) {
      try {
        this.permission = await Notification.requestPermission();
        this.notificationsEnabled = this.permission === 'granted';

        if (this.notificationsEnabled) {
          console.log('✅ Notificaciones habilitadas');
          this.scheduleDailyReminder();
          return true;
        } else {
          console.log('❌ Notificaciones denegadas');
          return false;
        }
      } catch (error) {
        console.error('Error al solicitar permisos:', error);
        return false;
      }
    } else {
      console.log('❌ Navegador no soporta notificaciones');
      return false;
    }
  }

  /**
   * Envía una notificación al usuario
   * @param {string} title - Título de la notificación
   * @param {object} options - Opciones de la notificación
   */
  async send(title, options = {}) {
    if (!this.notificationsEnabled) {
      console.log('Notificaciones deshabilitadas');
      return;
    }

    const defaultOptions = {
      icon: '/public/icon-192.png',
      badge: '/public/icon-72.png',
      vibrate: [200, 100, 200],
      tag: 'finanzas-notification',
      requireInteraction: false,
      ...options
    };

    try {
      // Si hay un service worker registrado, usar su API
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
      } else {
        // Fallback a notificación nativa
        this.lastNotification = new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  }

  /**
   * Programa recordatorio diario
   */
  scheduleDailyReminder() {
    const now = new Date();
    const [hours, minutes] = this.reminderTime.split(':');
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hours),
      parseInt(minutes)
    );

    // Si ya pasó la hora de hoy, programar para mañana
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime - now;

    setTimeout(() => {
      this.send('💰 Recordatorio de Finanzas', {
        body: '¡No olvides registrar tus gastos del día!',
        icon: '/public/icon-192.png',
        badge: '/public/icon-72.png',
        data: { action: 'open-app' }
      });

      // Reprogramar para el día siguiente
      this.scheduleDailyReminder();
    }, timeUntilNotification);

    console.log(`⏰ Recordatorio programado para ${scheduledTime.toLocaleString('es-CL')}`);
  }

  /**
   * Configura la hora del recordatorio diario
   * @param {string} time - Hora en formato HH:MM
   */
  setReminderTime(time) {
    this.reminderTime = time;
    localStorage.setItem('reminderTime', time);
    console.log(`⏰ Hora de recordatorio actualizada: ${time}`);
  }
}

// ============================================
// 3. SISTEMA DE RECOMENDACIONES IA
// ============================================

class SmartInsights {
  constructor() {
    this.insights = [];
    this.analysisCache = null;
  }

  /**
   * Analiza los gastos y genera recomendaciones inteligentes
   * @param {Array} transactions - Array de transacciones
   * @returns {Array} Array de insights/recomendaciones
   */
  analyzeSpending(transactions) {
    this.insights = [];

    if (!transactions || transactions.length === 0) {
      return this.insights;
    }

    // Análisis por categoría
    this.analyzeCategorySpending(transactions);

    // Análisis de tendencias semanales
    this.analyzeWeeklyTrends(transactions);

    // Análisis de gastos innecesarios
    this.analyzeUnnecessarySpending(transactions);

    // Análisis de comparación con mes anterior
    this.compareWithPreviousMonth(transactions);

    // Consejos de ahorro
    this.generateSavingTips(transactions);

    return this.insights;
  }

  /**
   * Analiza gastos por categoría
   */
  analyzeCategorySpending(transactions) {
    const categoryTotals = {};
    const categoryCount = {};

    transactions.forEach(t => {
      if (!categoryTotals[t.categoria]) {
        categoryTotals[t.categoria] = 0;
        categoryCount[t.categoria] = 0;
      }
      categoryTotals[t.categoria] += t.monto;
      categoryCount[t.categoria]++;
    });

    // Encontrar categoría con más gasto
    const maxCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    const maxAmount = categoryTotals[maxCategory];
    const percentage = (maxAmount / transactions.reduce((sum, t) => sum + t.monto, 0) * 100).toFixed(1);

    this.insights.push({
      type: 'category-analysis',
      icon: '📊',
      title: 'Categoría con más gasto',
      message: `Gastaste ${formatCLP(maxAmount)} en ${maxCategory} (${percentage}% del total)`,
      severity: percentage > 40 ? 'warning' : 'info',
      suggestion: percentage > 40 ?
        `Intenta reducir un 10% en ${maxCategory} para ahorrar ${formatCLP(maxAmount * 0.1)}` :
        'Mantén este equilibrio en tus gastos'
    });
  }

  /**
   * Analiza tendencias semanales
   */
  analyzeWeeklyTrends(transactions) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = transactions.filter(t => new Date(t.fecha) >= oneWeekAgo);
    const lastWeek = transactions.filter(t =>
      new Date(t.fecha) >= twoWeeksAgo && new Date(t.fecha) < oneWeekAgo
    );

    if (lastWeek.length === 0) return;

    const thisWeekTotal = thisWeek.reduce((sum, t) => sum + t.monto, 0);
    const lastWeekTotal = lastWeek.reduce((sum, t) => sum + t.monto, 0);
    const difference = thisWeekTotal - lastWeekTotal;
    const percentageChange = ((difference / lastWeekTotal) * 100).toFixed(1);

    if (difference > 0) {
      this.insights.push({
        type: 'weekly-trend',
        icon: '📈',
        title: 'Tendencia semanal',
        message: `Gastaste ${formatCLP(difference)} más que la semana pasada (+${percentageChange}%)`,
        severity: percentageChange > 20 ? 'warning' : 'info',
        suggestion: '¿Quieres revisar en qué categoría gastaste más?'
      });
    } else if (difference < 0) {
      this.insights.push({
        type: 'weekly-trend',
        icon: '📉',
        title: 'Tendencia semanal',
        message: `¡Ahorraste ${formatCLP(Math.abs(difference))} comparado con la semana pasada!`,
        severity: 'success',
        suggestion: '¡Excelente trabajo! Sigue así.'
      });
    }
  }

  /**
   * Analiza gastos innecesarios
   */
  analyzeUnnecessarySpending(transactions) {
    const lowPriorityCategories = ['Entretenimiento 🎬', 'Otro ➕'];
    const lowPrioritySpending = transactions
      .filter(t => lowPriorityCategories.includes(t.categoria) ||
                   t.necesidad === 'Baja' || t.necesidad === 'Media')
      .reduce((sum, t) => sum + t.monto, 0);

    const totalSpending = transactions.reduce((sum, t) => sum + t.monto, 0);
    const percentage = (lowPrioritySpending / totalSpending * 100).toFixed(1);

    if (percentage > 30) {
      this.insights.push({
        type: 'unnecessary-spending',
        icon: '💡',
        title: 'Oportunidad de ahorro',
        message: `${percentage}% de tus gastos son de baja prioridad (${formatCLP(lowPrioritySpending)})`,
        severity: 'warning',
        suggestion: `Reduciendo un 20% podrías ahorrar ${formatCLP(lowPrioritySpending * 0.2)}`
      });
    }
  }

  /**
   * Compara con el mes anterior
   */
  compareWithPreviousMonth(transactions) {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.fecha);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const lastMonth = transactions.filter(t => {
      const date = new Date(t.fecha);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() &&
             date.getFullYear() === lastMonthDate.getFullYear();
    });

    if (lastMonth.length === 0) return;

    const thisMonthTotal = thisMonth.reduce((sum, t) => sum + t.monto, 0);
    const lastMonthTotal = lastMonth.reduce((sum, t) => sum + t.monto, 0);
    const difference = thisMonthTotal - lastMonthTotal;

    if (Math.abs(difference) > lastMonthTotal * 0.1) { // Cambio mayor al 10%
      this.insights.push({
        type: 'monthly-comparison',
        icon: difference > 0 ? '⚠️' : '✅',
        title: 'Comparación mensual',
        message: difference > 0 ?
          `Estás gastando ${formatCLP(difference)} más que el mes pasado` :
          `¡Ahorraste ${formatCLP(Math.abs(difference))} vs. mes pasado!`,
        severity: difference > 0 ? 'warning' : 'success',
        suggestion: difference > 0 ?
          '¿Quieres ver qué categoría aumentó?' :
          '¡Mantén este ritmo!'
      });
    }
  }

  /**
   * Genera consejos de ahorro personalizados
   */
  generateSavingTips(transactions) {
    const tips = [
      {
        condition: () => {
          const foodSpending = transactions
            .filter(t => t.categoria === 'Alimentación 🍞')
            .reduce((sum, t) => sum + t.monto, 0);
          const total = transactions.reduce((sum, t) => sum + t.monto, 0);
          return (foodSpending / total) > 0.35;
        },
        insight: {
          type: 'saving-tip',
          icon: '🍽️',
          title: 'Consejo de ahorro',
          message: 'Los gastos en alimentación son altos',
          severity: 'info',
          suggestion: 'Planifica tus comidas semanalmente para reducir compras impulsivas'
        }
      },
      {
        condition: () => {
          const transportSpending = transactions
            .filter(t => t.categoria === 'Transporte 🚗')
            .reduce((sum, t) => sum + t.monto, 0);
          return transportSpending > 50000;
        },
        insight: {
          type: 'saving-tip',
          icon: '🚌',
          title: 'Consejo de ahorro',
          message: 'Gastos de transporte elevados',
          severity: 'info',
          suggestion: 'Considera opciones de transporte compartido o transporte público'
        }
      }
    ];

    tips.forEach(tip => {
      if (tip.condition()) {
        this.insights.push(tip.insight);
      }
    });
  }

  /**
   * Renderiza los insights en el DOM
   * @param {string} containerId - ID del contenedor donde renderizar
   */
  renderInsights(containerId) {
    const container = document.getElementById(containerId);
    if (!container || this.insights.length === 0) return;

    const severityColors = {
      success: '#10b981',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444'
    };

    container.innerHTML = `
      <div class="insights-container">
        <h3 style="margin-bottom: 16px;">🤖 Recomendaciones Inteligentes</h3>
        ${this.insights.map(insight => `
          <div class="insight-card" style="
            background: white;
            border-left: 4px solid ${severityColors[insight.severity]};
            padding: 16px;
            margin-bottom: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            <div style="display: flex; align-items: start; gap: 12px;">
              <span style="font-size: 24px;">${insight.icon}</span>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; color: #1f2937; font-size: 16px;">
                  ${insight.title}
                </h4>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  ${insight.message}
                </p>
                ${insight.suggestion ? `
                  <p style="margin: 0; color: ${severityColors[insight.severity]}; font-size: 13px; font-weight: 500;">
                    💡 ${insight.suggestion}
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ============================================
// 4. EXPORTAR INSTANCIAS GLOBALES
// ============================================

// Crear instancias globales
window.notificationManager = new NotificationManager();
window.smartInsights = new SmartInsights();

// Exportar funciones de moneda
window.formatCLP = formatCLP;
window.parseCLP = parseCLP;
window.updateAllCurrencyDisplays = updateAllCurrencyDisplays;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCurrencyAndNotifications);
} else {
  initializeCurrencyAndNotifications();
}

function initializeCurrencyAndNotifications() {
  console.log('💰 Sistema de moneda CLP inicializado');
  console.log('🔔 Sistema de notificaciones inicializado');

  // Cargar configuración guardada
  const savedReminderTime = localStorage.getItem('reminderTime');
  if (savedReminderTime) {
    window.notificationManager.reminderTime = savedReminderTime;
  }

  // Verificar si hay permisos de notificación ya otorgados
  if ('Notification' in window && Notification.permission === 'granted') {
    window.notificationManager.notificationsEnabled = true;
    window.notificationManager.permission = 'granted';
    window.notificationManager.scheduleDailyReminder();
  }
}

// Exportar para usar como módulo si es necesario
export {
  formatCLP,
  parseCLP,
  updateAllCurrencyDisplays,
  NotificationManager,
  SmartInsights
};
