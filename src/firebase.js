import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, remove, update, onDisconnect } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDtnGKeQPezd0bsbT3ZRowWIe9kzSrc2NI",
    authDomain: "messengerrumisoft.firebaseapp.com",
    databaseURL: "https://messengerrumisoft-default-rtdb.firebaseio.com",
    projectId: "messengerrumisoft",
    storageBucket: "messengerrumisoft.firebasestorage.app",
    messagingSenderId: "442332169285",
    appId: "1:442332169285:web:2b4c91507e02bc0b5e8f2c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ============================================================
// USUARIOS
// ============================================================
export const registrarUsuario = async (usuario, contraseña) => {
    try {
        const userRef = ref(db, `usuarios/${usuario}`);
        await set(userRef, {
            usuario: usuario,
            contraseña: contraseña,
            fechaRegistro: new Date().toISOString(),
            online: false
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const verificarUsuario = async (usuario, contraseña) => {
    try {
        const userRef = ref(db, `usuarios/${usuario}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.contraseña === contraseña) {
                return { success: true, data };
            }
            return { success: false, error: 'Contraseña incorrecta' };
        }
        return { success: false, error: 'Usuario no encontrado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const usuarioExiste = async (usuario) => {
    try {
        const userRef = ref(db, `usuarios/${usuario}`);
        const snapshot = await get(userRef);
        return snapshot.exists();
    } catch (error) {
        return false;
    }
};

export const setUserOnline = async (usuario) => {
    try {
        const userRef = ref(db, `usuarios/${usuario}/online`);
        await set(userRef, true);
        const onDisconnectRef = ref(db, `usuarios/${usuario}/online`);
        await onDisconnect(onDisconnectRef).set(false);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const setUserOffline = async (usuario) => {
    try {
        const userRef = ref(db, `usuarios/${usuario}/online`);
        await set(userRef, false);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const obtenerUsuarios = (callback) => {
    const usersRef = ref(db, 'usuarios');
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const usersArray = Object.values(data);
            callback(usersArray);
        } else {
            callback([]);
        }
    });
};

// ============================================================
// POSTS
// ============================================================
export const crearPost = async (usuario, fotoBase64, descripcion, cancion = '', videoUrl = '', videoFileName = '') => {
    try {
        const postsRef = ref(db, 'posts');
        const newPostRef = push(postsRef);
        await set(newPostRef, {
            id: newPostRef.key,
            foto: fotoBase64 || '',
            descripcion: descripcion || '📸 Recuerdo',
            cancion: cancion || '',
            video: videoUrl || '',
            videoFileName: videoFileName || '',
            tipo: videoUrl ? 'video' : 'foto',
            usuario: usuario,
            fecha: new Date().toISOString(),
            likes: 0,
            likedBy: {},
            comentarios: {}
        });
        return { success: true, id: newPostRef.key };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const obtenerPosts = (callback) => {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const postsArray = Object.values(data);
            postsArray.sort((a, b) => {
                if (a.fecha < b.fecha) return 1;
                if (a.fecha > b.fecha) return -1;
                return 0;
            });
            callback(postsArray);
        } else {
            callback([]);
        }
    });
};

export const eliminarPost = async (id) => {
    try {
        const postRef = ref(db, `posts/${id}`);
        await remove(postRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const darLike = async (id, usuario) => {
    try {
        const postRef = ref(db, `posts/${id}`);
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const likedBy = data.likedBy || {};
            if (likedBy[usuario]) {
                delete likedBy[usuario];
                await update(postRef, { likes: (data.likes || 0) - 1, likedBy: likedBy });
            } else {
                likedBy[usuario] = true;
                await update(postRef, { likes: (data.likes || 0) + 1, likedBy: likedBy });
            }
            return { success: true };
        }
        return { success: false, error: 'Post no encontrado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================================
// COMENTARIOS
// ============================================================
export const agregarComentario = async (postId, usuario, texto) => {
    try {
        const comentariosRef = ref(db, `posts/${postId}/comentarios`);
        const newCommentRef = push(comentariosRef);
        await set(newCommentRef, {
            id: newCommentRef.key,
            usuario: usuario,
            texto: texto,
            fecha: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const obtenerComentarios = (postId, callback) => {
    const comentariosRef = ref(db, `posts/${postId}/comentarios`);
    onValue(comentariosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const comentariosArray = Object.values(data);
            comentariosArray.sort((a, b) => {
                if (a.fecha < b.fecha) return -1;
                if (a.fecha > b.fecha) return 1;
                return 0;
            });
            callback(comentariosArray);
        } else {
            callback([]);
        }
    });
};

// ============================================================
// CHAT
// ============================================================
export const enviarMensaje = async (usuario, texto) => {
    try {
        const mensajesRef = ref(db, 'chat');
        const newMsgRef = push(mensajesRef);
        await set(newMsgRef, {
            id: newMsgRef.key,
            texto: texto,
            remitente: usuario,
            timestamp: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const obtenerMensajes = (callback) => {
    const mensajesRef = ref(db, 'chat');
    onValue(mensajesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const mensajesArray = Object.values(data);
            mensajesArray.sort((a, b) => {
                if (a.timestamp < b.timestamp) return -1;
                if (a.timestamp > b.timestamp) return 1;
                return 0;
            });
            callback(mensajesArray);
        } else {
            callback([]);
        }
    });
};