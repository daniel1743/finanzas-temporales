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

// Manejar reinicio de datos - VERSIÓN COMPLETA
async function handleResetData() {
    console.log('🗑️ Iniciando proceso de reinicio de datos...');

    // PRIMER AVISO - Explicación clara
    const confirmReset = confirm(
        '⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n' +
        'Esto BORRARÁ PERMANENTEMENTE:\n\n' +
        '❌ Todos los ingresos (base, extra, acumulados)\n' +
        '❌ Todos los gastos registrados\n' +
        '❌ Todas las transacciones\n' +
        '❌ Todas las categorías personalizadas\n' +
        '❌ Todo el historial financiero\n' +
        '❌ Fotos de perfil\n\n' +
        '✅ SE MANTENDRÁ: Tu sesión de usuario\n\n' +
        '¿Estás seguro de continuar?'
    );

    if (!confirmReset) {
        console.log('❌ Reinicio cancelado por el usuario (primer aviso)');
        return;
    }

    // SEGUNDA CONFIRMACIÓN - Código de seguridad
    const securityCode = prompt(
        '🔐 CONFIRMACIÓN FINAL\n\n' +
        'Para confirmar que realmente quieres borrar TODOS los datos,\n' +
        'escribe exactamente:\n\n' +
        'BORRAR TODO\n\n' +
        '(en mayúsculas, sin espacios extras)'
    );

    if (securityCode !== 'BORRAR TODO') {
        console.log('❌ Reinicio cancelado - código incorrecto:', securityCode);
        if (typeof showToast === 'function') {
            showToast('Operación cancelada. El código no coincide.', 'warning');
        } else {
            alert('❌ Operación cancelada. El código no coincide.');
        }
        return;
    }

    try {
        console.log('🚀 INICIANDO BORRADO COMPLETO DE DATOS...');
        console.log('='.repeat(50));

        // ====== PASO 1: GUARDAR CREDENCIALES ======
        console.log('📦 Paso 1: Guardando credenciales de sesión...');
        const autoLogin = localStorage.getItem('autoLogin');
        const userEmail = localStorage.getItem('userEmail');
        const rememberedCredentials = localStorage.getItem('rememberedCredentials');

        console.log('   Credenciales guardadas:', {
            autoLogin: !!autoLogin,
            userEmail: !!userEmail,
            rememberedCredentials: !!rememberedCredentials
        });

        // ====== PASO 2: LIMPIAR LOCALSTORAGE COMPLETAMENTE ======
        console.log('🧹 Paso 2: Limpiando localStorage...');
        localStorage.clear();
        console.log('   ✅ localStorage limpiado');

        // ====== PASO 3: RESTAURAR SOLO CREDENCIALES ======
        console.log('🔐 Paso 3: Restaurando credenciales de sesión...');
        if (autoLogin) localStorage.setItem('autoLogin', autoLogin);
        if (userEmail) localStorage.setItem('userEmail', userEmail);
        if (rememberedCredentials) localStorage.setItem('rememberedCredentials', rememberedCredentials);
        console.log('   ✅ Credenciales restauradas');

        // ====== PASO 4: RESETEAR DATOS EN MEMORIA (appData) ======
        console.log('💾 Paso 4: Reseteando datos en memoria...');
        if (typeof window.appData !== 'undefined') {
            const defaultData = {
                usuarios: [
                    {
                        id: 1,
                        nombre: 'Daniel',
                        foto: '',
                        ingresoBase: 0,
                        ingresoExtra: 0,
                        ingresosAcumulados: 0
                    },
                    {
                        id: 2,
                        nombre: 'Pareja',
                        foto: '',
                        ingresoBase: 0,
                        ingresoExtra: 0,
                        ingresosAcumulados: 0
                    }
                ],
                categorias: [
                    'Alimentación 🍞',
                    'Transporte 🚗',
                    'Entretenimiento 🎬',
                    'Salud 💊',
                    'Educación 📚',
                    'Otro ➕'
                ],
                necesidades: [
                    'Alta',
                    'Media',
                    'Baja'
                ],
                transacciones: [],
                usuarioActual: 1,
                mesActual: '',
                configuracion: {}
            };

            window.appData = defaultData;
            console.log('   ✅ appData reseteado:', window.appData);
        }

        // ====== PASO 5: LIMPIAR INDEXEDDB (CACHE DE FIREBASE) ======
        console.log('🗄️ Paso 5: Limpiando IndexedDB (cache de Firebase)...');
        try {
            // Obtener todas las bases de datos
            if (indexedDB.databases) {
                const databases = await indexedDB.databases();
                console.log('   Bases de datos encontradas:', databases.map(db => db.name));

                // Eliminar cada base de datos
                for (const db of databases) {
                    await new Promise((resolve, reject) => {
                        const request = indexedDB.deleteDatabase(db.name);
                        request.onsuccess = () => {
                            console.log(`   ✅ Base de datos "${db.name}" eliminada`);
                            resolve();
                        };
                        request.onerror = () => {
                            console.error(`   ⚠️ Error al eliminar "${db.name}"`);
                            resolve(); // Continuar aunque falle
                        };
                        request.onblocked = () => {
                            console.warn(`   ⚠️ "${db.name}" bloqueada, forzando eliminación...`);
                            setTimeout(resolve, 1000);
                        };
                    });
                }
            } else {
                // Fallback: intentar eliminar las bases de datos conocidas de Firebase
                const firebaseDatabases = [
                    'firebase-heartbeat-database',
                    'firebaseLocalStorageDb'
                ];

                for (const dbName of firebaseDatabases) {
                    await new Promise((resolve) => {
                        const request = indexedDB.deleteDatabase(dbName);
                        request.onsuccess = () => console.log(`   ✅ "${dbName}" eliminada`);
                        request.onerror = () => console.log(`   ℹ️ "${dbName}" no existe o ya fue eliminada`);
                        request.onblocked = () => console.log(`   ⚠️ "${dbName}" bloqueada`);
                        setTimeout(resolve, 500);
                    });
                }
            }
            console.log('   ✅ IndexedDB limpiado');
        } catch (indexedDBError) {
            console.error('   ⚠️ Error al limpiar IndexedDB:', indexedDBError);
        }

        // ====== PASO 6: ELIMINAR DATOS DE FIREBASE FIRESTORE ======
        console.log('🔥 Paso 6: Eliminando datos de Firebase Firestore...');
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            const userId = firebase.auth().currentUser.uid;
            const db = firebase.firestore();

            try {
                // Eliminar documento del usuario
                await db.collection('usuarios').doc(userId).delete();
                console.log('   ✅ Documento de Firebase eliminado');

                // Crear documento limpio con datos por defecto
                await db.collection('usuarios').doc(userId).set({
                    usuarios: [
                        { id: 1, nombre: 'Daniel', foto: '', ingresoBase: 0, ingresoExtra: 0, ingresosAcumulados: 0 },
                        { id: 2, nombre: 'Pareja', foto: '', ingresoBase: 0, ingresoExtra: 0, ingresosAcumulados: 0 }
                    ],
                    categorias: ['Alimentación 🍞', 'Transporte 🚗', 'Entretenimiento 🎬', 'Salud 💊', 'Educación 📚', 'Otro ➕'],
                    necesidades: ['Alta', 'Media', 'Baja'],
                    transacciones: [],
                    usuarioActual: 1,
                    configuracion: {},
                    lastUpdated: new Date().toISOString()
                });
                console.log('   ✅ Documento limpio creado en Firebase');
            } catch (firebaseError) {
                console.error('   ⚠️ Error con Firebase:', firebaseError);
            }
        } else {
            console.log('   ℹ️ Firebase no disponible o usuario no autenticado');
        }

        // ====== PASO 7: RESETEAR INPUTS DEL FORMULARIO ======
        console.log('📝 Paso 7: Limpiando formularios...');
        const inputsToReset = [
            'ingresoBase',
            'ingresoExtra',
            'montoGasto',
            'descripcionGasto',
            'categoria',
            'necesidad',
            'fechaGasto'
        ];

        inputsToReset.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                if (input.type === 'number' || input.type === 'text') {
                    input.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                }
            }
        });
        console.log('   ✅ Formularios limpiados');

        // ====== PASO 8: LIMPIAR VISUALIZACIONES ======
        console.log('🎨 Paso 8: Limpiando UI...');

        // Limpiar tarjetas del dashboard
        const cardsToReset = [
            'balanceGeneral',
            'totalGastado',
            'promedioDiario',
            'categoriaPrincipal',
            'totalTransacciones',
            'ingresosTotal',
            'gastosTotal'
        ];

        cardsToReset.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                card.textContent = '$0';
            }
        });

        // Limpiar lista de transacciones
        const transaccionesList = document.getElementById('transaccionesList');
        if (transaccionesList) {
            transaccionesList.innerHTML = '<p style="text-align: center; color: #6b7280;">No hay transacciones registradas</p>';
        }

        console.log('   ✅ UI limpiada');

        console.log('='.repeat(50));
        console.log('✅ REINICIO COMPLETO EXITOSO');

        // ====== MOSTRAR MENSAJE DE ÉXITO ======
        if (typeof showToast === 'function') {
            showToast('✅ Todos los datos han sido borrados. Recargando...', 'success');
        } else {
            alert('✅ Todos los datos han sido borrados correctamente.\n\nLa página se recargará en 2 segundos.');
        }

        // ====== RECARGAR LA PÁGINA ======
        console.log('🔄 Recargando página en 2 segundos...');
        setTimeout(() => {
            window.location.reload(true); // true = forzar recarga desde servidor
        }, 2000);

    } catch (error) {
        console.error('='.repeat(50));
        console.error('❌ ERROR CRÍTICO AL REINICIAR DATOS:', error);
        console.error('Stack trace:', error.stack);
        console.error('='.repeat(50));

        if (typeof showToast === 'function') {
            showToast('❌ Error al reiniciar los datos: ' + error.message, 'error');
        } else {
            alert('❌ Error al reiniciar los datos:\n\n' + error.message + '\n\nRevisa la consola para más detalles (F12)');
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
