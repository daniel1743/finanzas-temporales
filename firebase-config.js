// Configuración de Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2BxAldDYoQyEXh-PmJP4iBDuQXq3UvVM",
  authDomain: "aplicacion-gastos-temporal.firebaseapp.com",
  projectId: "aplicacion-gastos-temporal",
  storageBucket: "aplicacion-gastos-temporal.firebasestorage.app",
  messagingSenderId: "1073607578983",
  appId: "1:1073607578983:web:c9b98cccb9125f3e924bc2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Autenticación anónima automática
let currentUser = null;

async function initializeFirebaseAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        console.log('Usuario autenticado:', user.uid);
        resolve(user);
      } else {
        // Si no hay usuario, iniciar sesión anónima
        try {
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
          console.log('Usuario anónimo creado:', currentUser.uid);
          resolve(currentUser);
        } catch (error) {
          console.error('Error en autenticación:', error);
          reject(error);
        }
      }
    });
  });
}

// Funciones de Firestore

// Guardar datos completos
async function saveToFirestore(data) {
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userDocRef = doc(db, 'usuarios', currentUser.uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log('Datos guardados en Firestore');
    return true;
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    throw error;
  }
}

// Cargar datos completos
async function loadFromFirestore() {
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userDocRef = doc(db, 'usuarios', currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log('Datos cargados desde Firestore');
      return docSnap.data();
    } else {
      console.log('No hay datos en Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error al cargar desde Firestore:', error);
    throw error;
  }
}

// Guardar transacción individual (opcional, para sync más granular)
async function saveTransactionToFirestore(transaccion) {
  if (!currentUser) return;

  try {
    const transaccionRef = doc(db, 'usuarios', currentUser.uid, 'transacciones', String(transaccion.id));
    await setDoc(transaccionRef, transaccion);
    console.log('Transacción guardada:', transaccion.id);
  } catch (error) {
    console.error('Error al guardar transacción:', error);
  }
}

// Eliminar transacción de Firestore
async function deleteTransactionFromFirestore(transaccionId) {
  if (!currentUser) return;

  try {
    const transaccionRef = doc(db, 'usuarios', currentUser.uid, 'transacciones', String(transaccionId));
    await deleteDoc(transaccionRef);
    console.log('Transacción eliminada:', transaccionId);
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
  }
}

// Funciones de autenticación con email/password

// Registrar nuevo usuario
async function registerWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;

    // Actualizar perfil con el nombre
    if (displayName) {
      await updateProfile(currentUser, { displayName });
    }

    console.log('Usuario registrado:', currentUser.uid);
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Error al registrar:', error);
    return { success: false, error: error.message };
  }
}

// Iniciar sesión con email/password
async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    console.log('Usuario logueado:', currentUser.uid);
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return { success: false, error: error.message };
  }
}

// Cerrar sesión
async function logoutUser() {
  try {
    await signOut(auth);
    currentUser = null;
    console.log('Sesión cerrada');
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
}

// Continuar como anónimo
async function continueAnonymously() {
  try {
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('Usuario anónimo creado:', currentUser.uid);
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Error en autenticación anónima:', error);
    return { success: false, error: error.message };
  }
}

// Función para obtener el currentUser actualizado
function getCurrentUser() {
  return currentUser;
}

// Exportar funciones y variables
export {
  auth,
  db,
  currentUser,
  getCurrentUser,
  initializeFirebaseAuth,
  saveToFirestore,
  loadFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  continueAnonymously
};
