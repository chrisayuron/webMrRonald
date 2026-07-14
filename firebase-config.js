// firebase-config.js
// Configuración compartida de Firebase para estudiantes.html, admin.html y migrar-datos.html
// Este archivo SÍ puede subirse a GitHub sin problema: estos valores no son secretos,
// la seguridad real la dan las reglas de Firestore (firestore.rules), no esta config.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC0dEAvz7q_duG_iSIxz_Pcx5umXYP4png",
    authDomain: "mr-ronald-47de6.firebaseapp.com",
    databaseURL: "https://mr-ronald-47de6-default-rtdb.firebaseio.com",
    projectId: "mr-ronald-47de6",
    storageBucket: "mr-ronald-47de6.firebasestorage.app",
    messagingSenderId: "170288993665",
    appId: "1:170288993665:web:54eacff2fa7e8b88ae0480"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Nombre único de la colección para TODO el contenido de estudiantes.html.
// Cada documento se distingue por el campo "seccion": "guias" | "enlaces" | "recursos" | "noticias"
const RECURSOS_COLLECTION = "recursos";

export {
    app,
    auth,
    db,
    RECURSOS_COLLECTION,
    // Auth
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    // Firestore
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
};
