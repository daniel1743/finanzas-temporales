// ============================================
// FORMATEO DE NÚMEROS - Estilo Chileno
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNumberFormatting();
});

function initializeNumberFormatting() {
    // Lista de todos los campos numéricos que deben tener formato chileno
    const numericFields = [
        'ingresoBase',
        'ingresoExtra',
        'montoGasto',
        'filterMontoMin',
        'filterMontoMax',
        'montoRapido'
    ];

    numericFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Cambiar el tipo de input de "number" a "text" para permitir puntos
            field.type = 'text';
            field.inputMode = 'numeric'; // Mostrar teclado numérico en móviles

            // Aplicar formato al escribir
            field.addEventListener('input', function(e) {
                formatNumberInput(e.target);
            });

            // Aplicar formato al pegar
            field.addEventListener('paste', function(e) {
                setTimeout(() => formatNumberInput(e.target), 0);
            });
        }
    });
}

function formatNumberInput(input) {
    // Obtener el valor actual
    let value = input.value;

    // Guardar la posición del cursor
    const cursorPosition = input.selectionStart;
    const oldLength = value.length;

    // Remover todo excepto números
    let numericValue = value.replace(/[^\d]/g, '');

    // Si está vacío, no hacer nada
    if (numericValue === '') {
        input.value = '';
        return;
    }

    // Formatear con puntos de miles
    const formattedValue = formatChileanNumber(numericValue);

    // Actualizar el valor
    input.value = formattedValue;

    // Ajustar la posición del cursor
    const newLength = formattedValue.length;
    const lengthDifference = newLength - oldLength;
    const newCursorPosition = cursorPosition + lengthDifference;

    // Restaurar la posición del cursor
    input.setSelectionRange(newCursorPosition, newCursorPosition);

    // Guardar el valor numérico como atributo data
    input.dataset.numericValue = numericValue;
}

function formatChileanNumber(numericString) {
    // Convertir string a número para formatear
    const number = parseInt(numericString, 10);

    if (isNaN(number)) {
        return '';
    }

    // Formatear con separador de miles (punto)
    return number.toLocaleString('es-CL');
}

function parseChileanNumber(formattedString) {
    // Remover puntos y convertir a número
    if (!formattedString) return 0;
    const numericString = formattedString.toString().replace(/\./g, '');
    return parseInt(numericString, 10) || 0;
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.formatChileanNumber = formatChileanNumber;
    window.parseChileanNumber = parseChileanNumber;
}

// Función para obtener valor numérico de un campo formateado
function getNumericValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return 0;

    // Si tiene el atributo data-numeric-value, usarlo
    if (field.dataset.numericValue) {
        return parseInt(field.dataset.numericValue, 10) || 0;
    }

    // Si no, parsear el valor formateado
    return parseChileanNumber(field.value);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.getNumericValue = getNumericValue;
}
