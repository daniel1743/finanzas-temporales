// ============================================
// SIDEBAR Y BOTTOM NAVIGATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebarNavigation();
});

function initializeSidebarNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // Sincronizar navegación del sidebar con las tabs existentes
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.nav;

            // Actualizar estado activo en sidebar
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Actualizar estado activo en bottom nav
            bottomNavItems.forEach(i => i.classList.remove('active'));
            const correspondingBottomItem = document.querySelector(`.bottom-nav-item[data-nav="${tabName}"]`);
            if (correspondingBottomItem) {
                correspondingBottomItem.classList.add('active');
            }

            // Activar la tab correspondiente
            activateTab(tabName);

            // Cerrar sidebar en móvil
            closeSidebarMobile();
        });
    });

    // Sincronizar navegación del bottom nav
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.nav;

            // Actualizar estado activo en bottom nav
            bottomNavItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Actualizar estado activo en sidebar
            sidebarItems.forEach(i => i.classList.remove('active'));
            const correspondingSidebarItem = document.querySelector(`.sidebar-nav-item[data-nav="${tabName}"]`);
            if (correspondingSidebarItem) {
                correspondingSidebarItem.classList.add('active');
            }

            // Activar la tab correspondiente
            activateTab(tabName);
        });
    });

    // Toggle menu en móvil
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    // Cerrar sidebar al hacer click en overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeSidebarMobile();
        });
    }

    // Cerrar sidebar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebarMobile();
        }
    });
}

function activateTab(tabName) {
    // Ocultar todas las secciones
    const allSections = document.querySelectorAll('.tab-content');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    const activeSection = document.getElementById(tabName);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block';
    }

    // Actualizar la UI correspondiente
    if (typeof updateUI === 'function') {
        updateUI();
    }

    // Actualizar la navegación original (si existe)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeSidebarMobile() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
        sidebar.classList.remove('open');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        activateTab,
        closeSidebarMobile
    };
}
