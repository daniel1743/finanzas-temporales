// ============================================
// NAVBAR - Gestión de foto de perfil y sesión
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNavbar();
});

function initializeNavbar() {
    loadNavbarProfilePhoto();
    setupNavbarPhotoUpload();
    setupNavbarSessionButtons();
    setupNavbarDropdown();
    setupNavbarTitleClick();
}

// Cargar foto de perfil desde localStorage
function loadNavbarProfilePhoto() {
    const savedPhoto = localStorage.getItem('navbarProfilePhoto');
    const photoElement = document.getElementById('navbarProfilePhoto');
    const placeholderElement = document.getElementById('navbarProfilePlaceholder');

    if (savedPhoto && photoElement && placeholderElement) {
        photoElement.src = savedPhoto;
        photoElement.style.display = 'block';
        placeholderElement.style.display = 'none';
    }
}

// Configurar subida de foto de perfil
function setupNavbarPhotoUpload() {
    const photoContainer = document.getElementById('profilePhotoContainer');
    const photoInput = document.getElementById('navbarPhotoUpload');
    const photoElement = document.getElementById('navbarProfilePhoto');
    const placeholderElement = document.getElementById('navbarProfilePlaceholder');

    if (!photoContainer || !photoInput) return;

    // Click en el contenedor abre el selector de archivos
    photoContainer.addEventListener('click', function() {
        photoInput.click();
    });

    // Cuando se selecciona una foto
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            if (typeof showToast === 'function') {
                showToast('Por favor selecciona una imagen válida', 'error');
            } else {
                alert('Por favor selecciona una imagen válida');
            }
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('La imagen es muy grande. Máximo 5MB', 'error');
            } else {
                alert('La imagen es muy grande. Máximo 5MB');
            }
            return;
        }

        // Leer la imagen
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;

            // Guardar en localStorage
            try {
                localStorage.setItem('navbarProfilePhoto', imageData);

                // Actualizar la imagen en el navbar
                if (photoElement && placeholderElement) {
                    photoElement.src = imageData;
                    photoElement.style.display = 'block';
                    placeholderElement.style.display = 'none';
                }

                // Actualizar también en el dashboard si existe
                const dashboardAvatar = document.getElementById('userAvatar');
                if (dashboardAvatar) {
                    dashboardAvatar.src = imageData;
                }

                if (typeof showToast === 'function') {
                    showToast('Foto de perfil actualizada correctamente', 'success');
                }
            } catch (error) {
                console.error('Error al guardar la foto:', error);
                if (typeof showToast === 'function') {
                    showToast('Error al guardar la foto. Intenta con una imagen más pequeña', 'error');
                } else {
                    alert('Error al guardar la foto. Intenta con una imagen más pequeña');
                }
            }
        };

        reader.onerror = function() {
            if (typeof showToast === 'function') {
                showToast('Error al leer la imagen', 'error');
            } else {
                alert('Error al leer la imagen');
            }
        };

        reader.readAsDataURL(file);
    });
}

// Configurar botones de sesión
function setupNavbarSessionButtons() {
    const loginBtn = document.getElementById('navbarLoginBtn');
    const logoutBtn = document.getElementById('navbarLogoutBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // Mostrar modal de autenticación
            if (typeof showAuthModal === 'function') {
                showAuthModal();
            } else {
                // Buscar el modal de autenticación
                const authModal = document.getElementById('authModal');
                if (authModal) {
                    authModal.classList.add('active');
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Confirmar cierre de sesión
            const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
            if (!confirmLogout) return;

            // Limpiar credenciales guardadas
            localStorage.removeItem('rememberedCredentials');
            localStorage.removeItem('autoLogin');
            localStorage.removeItem('userEmail');

            // Cerrar sesión en Firebase si está disponible
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    if (typeof showToast === 'function') {
                        showToast('Sesión cerrada correctamente', 'success');
                    }

                    // Recargar la página
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }).catch((error) => {
                    console.error('Error al cerrar sesión:', error);
                    if (typeof showToast === 'function') {
                        showToast('Error al cerrar sesión', 'error');
                    }
                });
            } else {
                // Si no hay Firebase, simplemente recargar
                if (typeof showToast === 'function') {
                    showToast('Sesión cerrada', 'success');
                }
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        });
    }

    // Actualizar visibilidad de botones según estado de sesión
    updateNavbarSessionButtons();
}

// Actualizar visibilidad de botones de sesión
function updateNavbarSessionButtons() {
    const loginBtn = document.getElementById('navbarLoginBtn');
    const dropdownContainer = document.getElementById('navbarDropdownContainer');
    const autoLogin = localStorage.getItem('autoLogin');

    if (loginBtn && dropdownContainer) {
        if (autoLogin === 'true') {
            // Usuario tiene sesión activa - mostrar dropdown
            loginBtn.style.display = 'none';
            dropdownContainer.style.display = 'block';
        } else {
            // No hay sesión activa - mostrar botón login
            loginBtn.style.display = 'flex';
            dropdownContainer.style.display = 'none';
        }
    }
}

// Función para sincronizar foto entre navbar y dashboard
function syncProfilePhoto() {
    const navbarPhoto = document.getElementById('navbarProfilePhoto');
    const dashboardAvatar = document.getElementById('userAvatar');
    const savedPhoto = localStorage.getItem('navbarProfilePhoto');

    if (savedPhoto) {
        if (navbarPhoto) {
            navbarPhoto.src = savedPhoto;
            navbarPhoto.style.display = 'block';
            const placeholder = document.getElementById('navbarProfilePlaceholder');
            if (placeholder) placeholder.style.display = 'none';
        }
        if (dashboardAvatar) {
            dashboardAvatar.src = savedPhoto;
        }
    }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.updateNavbarSessionButtons = updateNavbarSessionButtons;
    window.syncProfilePhoto = syncProfilePhoto;
    window.loadNavbarProfilePhoto = loadNavbarProfilePhoto;
}

// Configurar dropdown del navbar
function setupNavbarDropdown() {
    const menuBtn = document.getElementById('navbarMenuBtn');
    const dropdown = document.getElementById('navbarDropdown');
    const dropdownContainer = document.getElementById('navbarDropdownContainer');

    if (!menuBtn || !dropdown) return;

    // Toggle dropdown
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        updateDropdownUserInfo();
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Configurar opciones del dropdown
    setupDropdownOptions();
}

// Actualizar información del usuario en el dropdown
function updateDropdownUserInfo() {
    const savedPhoto = localStorage.getItem('navbarProfilePhoto');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@email.com';
    const userName = localStorage.getItem('userName') || 'Usuario';

    // Avatar
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownAvatarPlaceholder = document.getElementById('dropdownAvatarPlaceholder');
    if (savedPhoto && dropdownAvatar && dropdownAvatarPlaceholder) {
        dropdownAvatar.src = savedPhoto;
        dropdownAvatar.style.display = 'block';
        dropdownAvatarPlaceholder.style.display = 'none';
    }

    // Nombre y email
    const nameElement = document.getElementById('dropdownUserName');
    const emailElement = document.getElementById('dropdownUserEmail');
    if (nameElement) nameElement.textContent = userName;
    if (emailElement) emailElement.textContent = userEmail;
}

// Configurar opciones del dropdown
function setupDropdownOptions() {
    const changePhotoBtn = document.getElementById('dropdownChangePhoto');
    const changeNameBtn = document.getElementById('dropdownChangeName');
    const settingsBtn = document.getElementById('dropdownSettings');
    const resetDataBtn = document.getElementById('dropdownResetData');
    const logoutBtn = document.getElementById('dropdownLogout');

    // Cambiar foto
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function() {
            const photoInput = document.getElementById('navbarPhotoUpload');
            if (photoInput) {
                photoInput.click();
            }
            closeDropdown();
        });
    }

    // Cambiar nombre
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', function() {
            const currentName = localStorage.getItem('userName') || 'Usuario';
            const newName = prompt('Ingresa tu nuevo nombre:', currentName);

            if (newName && newName.trim()) {
                localStorage.setItem('userName', newName.trim());
                updateDropdownUserInfo();

                // Actualizar en el dashboard si existe
                const userGreeting = document.getElementById('userGreeting');
                if (userGreeting) {
                    userGreeting.textContent = `Hola, ${newName.trim()} 👋`;
                }

                if (typeof showToast === 'function') {
                    showToast('Nombre actualizado correctamente', 'success');
                }
            }
            closeDropdown();
        });
    }

    // Ir a ajustes
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            // Activar la tab de configuración
            if (typeof activateTab === 'function') {
                activateTab('configuracion');
            }
            closeDropdown();
        });
    }

    // Reiniciar todos los datos
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', function() {
            handleResetData();
            closeDropdown();
        });
    }

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            handleLogout();
            closeDropdown();
        });
    }
}

// Cerrar dropdown
function closeDropdown() {
    const dropdown = document.getElementById('navbarDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// Manejar cierre de sesión
function handleLogout() {
    const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmLogout) return;

    // Limpiar credenciales guardadas
    localStorage.removeItem('rememberedCredentials');
    localStorage.removeItem('autoLogin');
    localStorage.removeItem('userEmail');

    // Cerrar sesión en Firebase si está disponible
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(() => {
            if (typeof showToast === 'function') {
                showToast('Sesión cerrada correctamente', 'success');
            }
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
            if (typeof showToast === 'function') {
                showToast('Error al cerrar sesión', 'error');
            }
        });
    } else {
        if (typeof showToast === 'function') {
            showToast('Sesión cerrada', 'success');
        }
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Escuchar cambios en el estado de autenticación
window.addEventListener('storage', function(e) {
    if (e.key === 'autoLogin' || e.key === 'navbarProfilePhoto') {
        updateNavbarSessionButtons();
        loadNavbarProfilePhoto();
    }
});

// Actualizar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        updateNavbarSessionButtons();
        syncProfilePhoto();
    }, 500);
});

// Manejar reinicio de datos
function handleResetData() {
    // Mostrar confirmación con doble verificación
    const confirmReset = confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS tus datos de manera permanente.\n\n¿Estás seguro de que deseas reiniciar todos los datos?\n\n- Se eliminarán todos los ingresos\n- Se eliminarán todos los gastos\n- Se eliminarán todas las transacciones\n- Se eliminarán todas las categorías personalizadas\n- Se restablecerán los usuarios a valores por defecto\n\nEsta acción NO se puede deshacer.');

    if (!confirmReset) return;

    // Segunda confirmación
    const finalConfirm = confirm('¿Realmente deseas continuar? Esta es tu última oportunidad para cancelar.');

    if (!finalConfirm) return;

    try {
        console.log('🗑️ Reiniciando todos los datos...');

        // Limpiar localStorage (excepto credenciales de sesión)
        const autoLogin = localStorage.getItem('autoLogin');
        const userEmail = localStorage.getItem('userEmail');
        const rememberedCredentials = localStorage.getItem('rememberedCredentials');

        // Eliminar todos los datos de la app
        localStorage.removeItem('finanzasAppData');
        localStorage.removeItem('navbarProfilePhoto');
        localStorage.removeItem('userName');

        // Restaurar credenciales de sesión si existen
        if (autoLogin) localStorage.setItem('autoLogin', autoLogin);
        if (userEmail) localStorage.setItem('userEmail', userEmail);
        if (rememberedCredentials) localStorage.setItem('rememberedCredentials', rememberedCredentials);

        console.log('✅ Datos eliminados de localStorage');

        // Reiniciar datos en Firebase si está disponible
        if (typeof window.resetFirebaseData === 'function') {
            window.resetFirebaseData();
            console.log('✅ Datos eliminados de Firebase');
        }

        // Mostrar mensaje de éxito
        if (typeof showToast === 'function') {
            showToast('Todos los datos han sido reiniciados correctamente', 'success');
        } else {
            alert('✅ Todos los datos han sido reiniciados correctamente');
        }

        // Recargar la página después de 1 segundo
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error al reiniciar datos:', error);
        if (typeof showToast === 'function') {
            showToast('Error al reiniciar los datos. Intenta de nuevo.', 'error');
        } else {
            alert('❌ Error al reiniciar los datos. Intenta de nuevo.');
        }
    }
}

// Configurar click en el título del navbar para ir al dashboard
function setupNavbarTitleClick() {
    const navbarTitle = document.querySelector('.navbar-title');
    if (navbarTitle) {
        navbarTitle.addEventListener('click', function() {
            // Activar la tab del dashboard
            if (typeof activateTab === 'function') {
                activateTab('dashboard');
            }

            // Actualizar estado activo en sidebar
            const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
            sidebarItems.forEach(item => {
                if (item.dataset.nav === 'dashboard') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Actualizar estado activo en bottom nav
            const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
            bottomNavItems.forEach(item => {
                if (item.dataset.nav === 'dashboard') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
