// ============================================================
// crear-archivos.js
// Ejecuta con: node crear-archivos.js
// (Pon este archivo dentro de tu proyecto)
// ============================================================

const fs = require('fs');
const path = require('path');

// ============================================================
// CONTENIDO DE LOS ARCHIVOS
// ============================================================

// 1. firebase.js
const firebaseJs = `import { initializeApp } from 'firebase/app';
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
        const userRef = ref(db, \`usuarios/\${usuario}\`);
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
        const userRef = ref(db, \`usuarios/\${usuario}\`);
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
        const userRef = ref(db, \`usuarios/\${usuario}\`);
        const snapshot = await get(userRef);
        return snapshot.exists();
    } catch (error) {
        return false;
    }
};

export const setUserOnline = async (usuario) => {
    try {
        const userRef = ref(db, \`usuarios/\${usuario}/online\`);
        await set(userRef, true);
        const onDisconnectRef = ref(db, \`usuarios/\${usuario}/online\`);
        await onDisconnect(onDisconnectRef).set(false);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const setUserOffline = async (usuario) => {
    try {
        const userRef = ref(db, \`usuarios/\${usuario}/online\`);
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
        const postRef = ref(db, \`posts/\${id}\`);
        await remove(postRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const darLike = async (id, usuario) => {
    try {
        const postRef = ref(db, \`posts/\${id}\`);
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
        const comentariosRef = ref(db, \`posts/\${postId}/comentarios\`);
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
    const comentariosRef = ref(db, \`posts/\${postId}/comentarios\`);
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
};`;

// 2. supabase.js
const supabaseJs = `import { createClient } from '@supabase/supabase-js';

// 🔥 REEMPLAZA con tus credenciales
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4ojcaW4thUOspVi_k1W5cQ_noKqSm1m';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const subirVideoSupabase = async (usuario, file) => {
    try {
        if (!file) throw new Error('No se seleccionó ningún archivo');
        if (!file.type.startsWith('video/')) throw new Error('Solo se permiten videos');
        if (file.size > 50 * 1024 * 1024) throw new Error('El video es demasiado grande. Máximo 50MB');

        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = \`\${usuario}_\${timestamp}.\${fileExt}\`;

        const { data, error } = await supabase.storage.from('videos').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

        if (error) throw new Error(error.message);

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);

        return {
            success: true,
            url: urlData.publicUrl,
            fileName: fileName,
            name: file.name
        };
    } catch (error) {
        console.error('Error al subir video:', error);
        return { success: false, error: error.message };
    }
};

export const eliminarVideoSupabase = async (fileName) => {
    try {
        const { error } = await supabase.storage.from('videos').remove([fileName]);
        if (error) throw new Error(error.message);
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar video:', error);
        return { success: false, error: error.message };
    }
};`;

// 3. Login.js
const loginJs = `import React, { useState } from 'react';
import { verificarUsuario } from '../firebase';
import './Login.css';

const Login = ({ onLogin, onRegisterClick }) => {
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const usuarioTrim = usuario.trim().toLowerCase();
        const passTrim = contraseña.trim();

        if (!usuarioTrim || !passTrim) {
            setError('Por favor ingresa tu usuario y contraseña');
            return;
        }

        setCargando(true);
        const result = await verificarUsuario(usuarioTrim, passTrim);
        if (result.success) {
            onLogin(usuarioTrim);
        } else {
            setError(\`❌ \${result.error}\`);
        }
        setCargando(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="heart-float">💕</div>
                    <h1>Nuestro Espacio</h1>
                    <p>Inicia sesión para ver nuestros recuerdos</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <input type="text" placeholder="👤 Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={cargando} className={error ? 'error' : ''} />
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="🔒 Contraseña" value={contraseña} onChange={(e) => setContraseña(e.target.value)} disabled={cargando} className={error ? 'error' : ''} onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)} />
                    </div>
                    {error && <span className="error-message">{error}</span>}
                    <button type="submit" className="login-btn" disabled={cargando}>
                        {cargando ? <><span className="spinner"></span> Ingresando...</> : <><span>Entrar</span><span className="btn-icon">❤️</span></>}
                    </button>
                    <div className="login-footer">
                        <p>¿No tienes cuenta? <span className="link-text" onClick={onRegisterClick}>Regístrate aquí</span></p>
                        <div className="floating-hearts"><span>💖</span><span>💕</span><span>💗</span><span>💝</span></div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Login;`;

// 4. Login.css
const loginCss = `.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 20px;
    animation: fadeInUp 0.8s ease;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
.login-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 30px;
    padding: 50px 40px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(107, 47, 160, 0.2);
    position: relative;
    overflow: hidden;
}
.login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #2ECC71, #8E44AD, #6B2FA0, #27AE60);
    background-size: 300% 100%;
    animation: gradientMove 4s ease infinite;
}
@keyframes gradientMove {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
.login-header { text-align: center; margin-bottom: 35px; }
.heart-float { font-size: 3.5em; animation: float 2s ease-in-out infinite; display: inline-block; }
@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
}
.login-header h1 {
    font-size: 2em;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    letter-spacing: 2px;
    margin-top: 5px;
}
.login-header p { color: #7f8c8d; font-size: 0.95em; margin-top: 5px; }
.login-form { display: flex; flex-direction: column; gap: 18px; }
.input-group input {
    width: 100%;
    padding: 15px 20px;
    border: 2px solid #ecf0f1;
    border-radius: 15px;
    font-size: 1em;
    outline: none;
    transition: all 0.3s ease;
    background: #f8f4f0;
}
.input-group input:focus { border-color: #8E44AD; box-shadow: 0 0 0 4px rgba(142, 68, 173, 0.15); }
.input-group input.error { border-color: #e74c3c; animation: shake 0.5s ease; }
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
.error-message { color: #e74c3c; font-size: 0.9em; display: block; }
.login-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    color: white;
    border: none;
    border-radius: 15px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}
.login-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(107, 47, 160, 0.4); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.login-btn .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.btn-icon { font-size: 1.2em; transition: all 0.3s ease; }
.login-btn:hover .btn-icon:not(:disabled) { transform: scale(1.3) rotate(-10deg); }
.login-footer { text-align: center; margin-top: 10px; }
.login-footer p { color: #7f8c8d; font-size: 0.95em; }
.login-footer .link-text {
    background: linear-gradient(135deg, #6B2FA0, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    cursor: pointer;
}
.floating-hearts { display: flex; justify-content: center; gap: 12px; margin-top: 15px; }
.floating-hearts span { animation: floatHeart 2s ease-in-out infinite; font-size: 1.3em; }
.floating-hearts span:nth-child(2) { animation-delay: 0.5s; }
.floating-hearts span:nth-child(3) { animation-delay: 1s; }
.floating-hearts span:nth-child(4) { animation-delay: 1.5s; }
@keyframes floatHeart {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-8px) scale(1.1); }
}
@media (max-width: 480px) {
    .login-card { padding: 35px 25px; }
    .login-header h1 { font-size: 1.6em; }
    .heart-float { font-size: 2.8em; }
}`;

// 5. Register.js
const registerJs = `import React, { useState } from 'react';
import { registrarUsuario, usuarioExiste } from '../firebase';
import './Register.css';

const Register = ({ onRegisterSuccess, onBackToLogin }) => {
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const usuarioTrim = usuario.trim().toLowerCase();
        const passTrim = contraseña.trim();

        if (!usuarioTrim || !passTrim || !confirmar) {
            setError('Todos los campos son obligatorios');
            return;
        }
        if (usuarioTrim.length < 2) { setError('El usuario debe tener al menos 2 caracteres'); return; }
        if (passTrim.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
        if (passTrim !== confirmar) { setError('Las contraseñas no coinciden'); return; }

        setCargando(true);
        const existe = await usuarioExiste(usuarioTrim);
        if (existe) { setError('❌ El usuario ya existe'); setCargando(false); return; }

        const result = await registrarUsuario(usuarioTrim, passTrim);
        if (result.success) { setExito(true); setTimeout(onRegisterSuccess, 1500); }
        else { setError(\`❌ Error: \${result.error}\`); }
        setCargando(false);
    };

    if (exito) {
        return (
            <div className="register-container">
                <div className="register-card">
                    <div className="register-success">
                        <span className="success-icon">✅</span>
                        <h2>¡Registro exitoso!</h2>
                        <p>Ahora puedes iniciar sesión</p>
                        <button onClick={onBackToLogin} className="back-login-btn">Ir al Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <div className="heart-float">💕</div>
                    <h1>Crear Cuenta</h1>
                    <p>Regístrate para empezar a compartir</p>
                </div>
                <form onSubmit={handleSubmit} className="register-form">
                    <input type="text" placeholder="👤 Elige un nombre de usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={cargando} />
                    <input type="password" placeholder="🔒 Contraseña (mínimo 4 caracteres)" value={contraseña} onChange={(e) => setContraseña(e.target.value)} disabled={cargando} />
                    <input type="password" placeholder="🔒 Confirmar contraseña" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} disabled={cargando} />
                    {error && <span className="error-message">{error}</span>}
                    <button type="submit" className="register-btn" disabled={cargando}>
                        {cargando ? <><span className="spinner"></span> Registrando...</> : '💖 Registrarme'}
                    </button>
                    <div className="register-footer">
                        <p>¿Ya tienes cuenta? <span className="link-text" onClick={onBackToLogin}>Inicia sesión</span></p>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Register;`;

// 6. Register.css
const registerCss = `.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 20px;
    animation: fadeInUp 0.8s ease;
}
.register-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 30px;
    padding: 45px 35px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(107, 47, 160, 0.2);
    position: relative;
    overflow: hidden;
}
.register-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #2ECC71, #8E44AD, #27AE60, #6B2FA0);
    background-size: 300% 100%;
    animation: gradientMove 4s ease infinite;
}
.register-header { text-align: center; margin-bottom: 30px; }
.register-header .heart-float { font-size: 3em; animation: float 2s ease-in-out infinite; display: inline-block; }
.register-header h1 {
    font-size: 1.8em;
    background: linear-gradient(135deg, #6B2FA0, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    letter-spacing: 2px;
    margin-top: 5px;
}
.register-header p { color: #7f8c8d; font-size: 0.95em; margin-top: 5px; }
.register-form { display: flex; flex-direction: column; gap: 15px; }
.register-form input {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid #ecf0f1;
    border-radius: 15px;
    font-size: 1em;
    outline: none;
    transition: all 0.3s ease;
    background: #f8f4f0;
}
.register-form input:focus { border-color: #2ECC71; box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.15); }
.register-btn {
    padding: 14px;
    background: linear-gradient(135deg, #2ECC71, #27AE60);
    color: white;
    border: none;
    border-radius: 15px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.register-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(46, 204, 113, 0.4); }
.register-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.register-btn .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
.register-footer { text-align: center; margin-top: 10px; color: #7f8c8d; }
.register-footer .link-text {
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    cursor: pointer;
}
.register-success { text-align: center; padding: 20px 0; }
.register-success .success-icon { font-size: 4em; display: block; margin-bottom: 10px; }
.register-success h2 {
    background: linear-gradient(135deg, #2ECC71, #27AE60);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
}
.back-login-btn {
    padding: 12px 35px;
    background: linear-gradient(135deg, #8E44AD, #6B2FA0);
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s;
}
.back-login-btn:hover { transform: scale(1.05); box-shadow: 0 10px 25px rgba(107, 47, 160, 0.3); }
@media (max-width: 480px) {
    .register-card { padding: 35px 20px; }
    .register-header h1 { font-size: 1.5em; }
}`;

// 7. Album.js (COMPLETO)
const albumJs = `import React, { useState, useEffect, useRef } from 'react';
import {
    crearPost,
    obtenerPosts,
    eliminarPost,
    darLike,
    agregarComentario,
    obtenerComentarios,
    enviarMensaje,
    obtenerMensajes,
    obtenerUsuarios
} from '../firebase';
import { subirVideoSupabase, eliminarVideoSupabase } from '../config/supabase';
import './Album.css';

const Album = ({ usuario, onLogout }) => {
    const [posts, setPosts] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [cancion, setCancion] = useState('');
    const [tabActiva, setTabActiva] = useState('posts');
    const [cargandoPosts, setCargandoPosts] = useState(true);
    const [cargandoMensajes, setCargandoMensajes] = useState(true);
    const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
    const [subiendo, setSubiendo] = useState(false);
    const [mensajeSubida, setMensajeSubida] = useState('');
    const [previewUrls, setPreviewUrls] = useState([]);
    const chatRef = useRef(null);
    const fileInputRef = useRef(null);

    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFileName, setVideoFileName] = useState('');
    const [videoSubiendo, setVideoSubiendo] = useState(false);
    const videoInputRef = useRef(null);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [postSeleccionado, setPostSeleccionado] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [cargandoComentarios, setCargandoComentarios] = useState(false);
    const comentariosRef = useRef(null);

    const comprimirImagen = (file, maxWidth = 800, calidad = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width,
                        height = img.height;
                    if (width > maxWidth) { height = (maxWidth / width) * height;
                        width = maxWidth; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', calidad));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(previews);
        setArchivosSeleccionados(files);
        setMensajeSubida(\`📸 \${files.length} foto(s) seleccionada(s)\`);
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) { alert('⚠️ Solo se permiten videos');
            e.target.value = '';
            return; }
        if (file.size > 50 * 1024 * 1024) { alert('⚠️ El video es demasiado grande. Máximo 50MB');
            e.target.value = '';
            return; }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
        setMensajeSubida(\`🎬 Video seleccionado: \${file.name}\`);
    };

    const subirPostHandler = async () => {
        if (archivosSeleccionados.length === 0 && !videoFile) {
            setMensajeSubida('⚠️ Selecciona al menos una foto o un video');
            return;
        }
        setSubiendo(true);
        setMensajeSubida('⏳ Subiendo...');
        const desc = descripcion.trim() || '📸 Recuerdo';
        const cancionUrl = cancion.trim();
        let fotoUrl = '';
        let videoUrlFinal = '';
        let videoFileNameFinal = '';
        let subidas = 0,
            errores = 0;

        if (videoFile) {
            setVideoSubiendo(true);
            const result = await subirVideoSupabase(usuario, videoFile);
            setVideoSubiendo(false);
            if (result.success) {
                videoUrlFinal = result.url;
                videoFileNameFinal = result.fileName;
                setMensajeSubida('✅ Video subido a Supabase');
            } else {
                setMensajeSubida(\`❌ Error al subir video: \${result.error}\`);
                setSubiendo(false);
                return;
            }
        }

        if (archivosSeleccionados.length > 0) {
            for (const file of archivosSeleccionados) {
                if (!file.type.startsWith('image/')) continue;
                try {
                    const base64 = await comprimirImagen(file);
                    const result = await crearPost(usuario, base64, desc, cancionUrl, videoUrlFinal, videoFileNameFinal);
                    if (result.success) subidas++;
                    else errores++;
                } catch (error) { console.error('Error al subir foto:', error);
                    errores++; }
            }
        } else if (videoUrlFinal) {
            const result = await crearPost(
                usuario,
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%236B2FA0"/%3E%3Ctext x="50%25" y="50%25" font-size="40" text-anchor="middle" dy=".3em" fill="white"%3E🎬%3C/text%3E%3C/svg%3E',
                desc,
                cancionUrl,
                videoUrlFinal,
                videoFileNameFinal
            );
            if (result.success) subidas++;
            else errores++;
        }

        setArchivosSeleccionados([]);
        setPreviewUrls([]);
        setDescripcion('');
        setCancion('');
        setVideoFile(null);
        setVideoPreview(null);
        setVideoUrl('');
        setVideoFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';

        setMensajeSubida(errores === 0 ? \`✅ \${subidas} archivo(s) subido(s) correctamente\` : \`⚠️ \${subidas} subidas, \${errores} errores\`);
        setSubiendo(false);
        setVideoSubiendo(false);
        setTimeout(() => setMensajeSubida(''), 4000);
    };

    const eliminarPostHandler = async (id) => {
        if (!window.confirm('¿Eliminar este recuerdo?')) return;
        const post = posts.find(p => p.id === id);
        if (post && post.tipo === 'video' && post.videoFileName) {
            await eliminarVideoSupabase(post.videoFileName);
        }
        const result = await eliminarPost(id);
        if (!result.success) alert('Error al eliminar el post');
    };

    const likeHandler = async (id) => { await darLike(id, usuario); };

    const abrirModal = (post) => {
        setPostSeleccionado(post);
        setModalAbierto(true);
        setCargandoComentarios(true);
        setComentarios([]);
        setNuevoComentario('');
        obtenerComentarios(post.id, (comentariosData) => {
            setComentarios(comentariosData);
            setCargandoComentarios(false);
            setTimeout(() => { if (comentariosRef.current) comentariosRef.current.scrollTop = comentariosRef.current.scrollHeight; }, 100);
        });
    };

    const cerrarModal = () => { setModalAbierto(false);
        setPostSeleccionado(null);
        setComentarios([]); };

    const enviarComentario = async () => {
        if (!nuevoComentario.trim() || !postSeleccionado) return;
        const result = await agregarComentario(postSeleccionado.id, usuario, nuevoComentario.trim());
        if (result.success) setNuevoComentario('');
        else alert('Error al enviar comentario');
    };

    const enviarMensajeHandler = async () => {
        if (!nuevoMensaje.trim()) return;
        const result = await enviarMensaje(usuario, nuevoMensaje);
        if (result.success) setNuevoMensaje('');
        else alert('Error al enviar el mensaje');
    };

    useEffect(() => {
        obtenerPosts((postsData) => { setPosts(postsData);
            setCargandoPosts(false); });
        obtenerUsuarios((usersData) => { setUsuarios(usersData); });
    }, []);

    useEffect(() => {
        obtenerMensajes((mensajesData) => {
            setMensajes(mensajesData);
            setCargandoMensajes(false);
            setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 100);
        });
    }, []);

    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, [previewUrls, videoPreview]);

    const formatearFecha = (fechaStr) => {
        try { const date = new Date(fechaStr); return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return 'Fecha desconocida'; }
    };
    const formatearHora = (fechaStr) => {
        try { const date = new Date(fechaStr); return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
    };
    const formatearFechaCompleta = (fechaStr) => {
        try { const date = new Date(fechaStr); return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
    };

    const obtenerNombreUsuario = (nombre) => {
        if (!nombre) return 'Usuario';
        if (nombre === 'yo' || nombre === usuario) return 'Tú';
        return nombre;
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? match[1] : null;
    };
    const getSpotifyId = (url) => {
        if (!url) return null;
        const match = url.match(/spotify\.com\/track\/([^?\s]+)/);
        return match ? match[1] : null;
    };

    const isUserOnline = (nombre) => {
        const user = usuarios.find(u => u.usuario === nombre);
        return user ? user.online : false;
    };

    return (
        <div className="album-container">
            <div className="album-header">
                <h1>💕 Nuestro Espacio</h1>
                <div className="user-info">
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{obtenerNombreUsuario(usuario)}</span>
                    <span className={\`online-status \${isUserOnline(usuario) ? 'online' : 'offline'}\`}></span>
                    <button onClick={onLogout} className="logout-btn">🚪 Salir</button>
                </div>
            </div>

            <div className="tabs-container">
                <button className={\`tab-btn \${tabActiva === 'posts' ? 'active' : ''}\`} onClick={() => setTabActiva('posts')}>📸 Posts ({posts.length})</button>
                <button className={\`tab-btn \${tabActiva === 'chat' ? 'active' : ''}\`} onClick={() => setTabActiva('chat')}>💬 Chat ({mensajes.length})</button>
            </div>

            <div className="tab-content">
                {tabActiva === 'posts' && (
                    <div className="posts-tab">
                        <div className="upload-area">
                            <div className="upload-content">
                                <h3 className="upload-title">📤 Subir foto o video</h3>
                                <div className="upload-input-group">
                                    <input type="file" id="fileInput" ref={fileInputRef} accept="image/*" multiple onChange={handleFileSelect} className="file-input-hidden" />
                                    <label htmlFor="fileInput" className="upload-btn"><span className="upload-icon">📁</span> Seleccionar fotos</label>
                                    <span className="file-count">{archivosSeleccionados.length > 0 ? \`\${archivosSeleccionados.length} seleccionada(s)\` : 'Ninguna seleccionada'}</span>
                                </div>
                                {previewUrls.length > 0 && (
                                    <div className="preview-container">
                                        {previewUrls.map((url, index) => (<div key={index} className="preview-item"><img src={url} alt={\`Vista previa \${index + 1}\`} /></div>))}
                                    </div>
                                )}
                                <div className="video-local-group">
                                    <input type="file" id="videoInput" ref={videoInputRef} accept="video/*" onChange={handleVideoSelect} className="file-input-hidden" disabled={videoSubiendo} />
                                    <label htmlFor="videoInput" className="video-local-btn"><span className="video-icon">🎬</span> Seleccionar video</label>
                                    {videoSubiendo && <span className="video-uploading">⏳ Subiendo a Supabase...</span>}
                                    {videoFile && !videoSubiendo && <span className="file-count">✅ {videoFile.name}</span>}
                                </div>
                                {videoPreview && (
                                    <div className="preview-container">
                                        <video src={videoPreview} controls className="preview-video" />
                                        <button className="remove-preview-btn" onClick={() => { setVideoFile(null);
                                            setVideoPreview(null);
                                            setVideoUrl('');
                                            setVideoFileName('');
                                            if (videoInputRef.current) videoInputRef.current.value = ''; }}>✕</button>
                                    </div>
                                )}
                                <input type="text" className="desc-input" placeholder="📝 Escribe una descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={subiendo} />
                                <div className="cancion-input-group">
                                    <div className="cancion-icon">🎵</div>
                                    <input type="text" className="cancion-input" placeholder="🔗 Pega enlace de YouTube/Spotify (opcional)" value={cancion} onChange={(e) => setCancion(e.target.value)} disabled={subiendo} />
                                    {cancion && <span className="cancion-preview">{getYouTubeId(cancion) ? '🎬 YouTube' : getSpotifyId(cancion) ? '🎧 Spotify' : '🔗 Enlace'}</span>}
                                </div>
                                <button className="upload-submit-btn" onClick={subirPostHandler} disabled={subiendo || videoSubiendo || (archivosSeleccionados.length === 0 && !videoFile)}>
                                    {subiendo || videoSubiendo ? <><span className="spinner"></span>{videoSubiendo ? 'Subiendo video...' : 'Subiendo...'}</> : <><span className="upload-icon">⬆️</span> Publicar</>}
                                </button>
                                {mensajeSubida && <div className={\`upload-message \${mensajeSubida.includes('✅') ? 'success' : mensajeSubida.includes('❌') ? 'error' : 'info'}\`}>{mensajeSubida}</div>}
                            </div>
                        </div>

                        <div className="posts-gallery">
                            {cargandoPosts ? (
                                <div className="loading-state"><div className="loading-spinner"></div><p>Cargando posts...</p></div>
                            ) : posts.length === 0 ? (
                                <div className="empty-state"><span className="empty-icon">🌅</span><h3>No hay posts aún</h3><p>Sube tu primera foto o video</p></div>
                            ) : (
                                posts.map((post) => (
                                    <div key={post.id} className={\`post-card \${post.tipo === 'video' ? 'video-card' : ''}\`} onClick={() => abrirModal(post)}>
                                        {post.tipo === 'video' ? (
                                            <div className="video-thumbnail">
                                                <video src={post.video} muted preload="metadata" className="video-thumbnail-player" />
                                                <div className="video-play-icon">▶️</div>
                                            </div>
                                        ) : <img src={post.foto} alt={post.descripcion} loading="lazy" />}
                                        {post.cancion && <div className="music-badge">🎵</div>}
                                        {post.tipo === 'video' && <div className="video-badge">🎬</div>}
                                        <div className="post-overlay">
                                            <button className="delete-btn" onClick={(e) => { e.stopPropagation();
                                                eliminarPostHandler(post.id); }} title="Eliminar">✕</button>
                                            <div className="post-stats">
                                                <span className="stat">❤️ {post.likes || 0}</span>
                                                <span className="stat">💬 {post.comentarios ? Object.keys(post.comentarios).length : 0}</span>
                                            </div>
                                        </div>
                                        <div className="post-info">
                                            <p className="post-desc">{post.descripcion}</p>
                                            {post.cancion && <p className="post-music">🎵 Canción incluida</p>}
                                            {post.tipo === 'video' && <p className="post-type">🎬 Video</p>}
                                            <span className="post-date">{formatearFecha(post.fecha)}</span>
                                            <span className="post-user">👤 {obtenerNombreUsuario(post.usuario)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tabActiva === 'chat' && (
                    <div className="chat-tab">
                        <div className="chat-container">
                            <div className="chat-header">
                                <h3>💬 Chat en tiempo real</h3>
                                <div className="chat-online-users">
                                    <span>👥 {usuarios.filter(u => u.online).length} en línea</span>
                                </div>
                            </div>
                            <div className="chat-messages" ref={chatRef}>
                                {cargandoMensajes ? (
                                    <div className="loading-state"><div className="loading-spinner"></div><p>Cargando mensajes...</p></div>
                                ) : mensajes.length === 0 ? (
                                    <div className="empty-chat"><span className="empty-icon">💬</span><p>Envíen el primer mensaje</p></div>
                                ) : (
                                    mensajes.map((msg) => (
                                        <div key={msg.id} className={\`message \${msg.remitente === usuario ? 'mine' : 'hers'}\`}>
                                            <div className="message-content">
                                                <div className="message-sender">
                                                    <span className="sender-name">{obtenerNombreUsuario(msg.remitente)}</span>
                                                    <span className={\`sender-status \${isUserOnline(msg.remitente) ? 'online' : 'offline'}\`}></span>
                                                </div>
                                                <p className="message-text">{msg.texto}</p>
                                                <span className="message-time">{formatearHora(msg.timestamp)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="chat-input-area">
                                <input type="text" placeholder="Escribe algo bonito..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault();
                                        enviarMensajeHandler(); } }} maxLength="500" />
                                <button onClick={enviarMensajeHandler} className="send-btn"><span>Enviar</span><span className="send-icon">❤️</span></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== MODAL ===== */}
            {modalAbierto && postSeleccionado && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={cerrarModal}>✕</button>
                        <div className="modal-body">
                            <div className="modal-image">
                                {postSeleccionado.tipo === 'video' ? <video src={postSeleccionado.video} controls className="modal-video" autoPlay preload="metadata" /> : <img src={postSeleccionado.foto} alt={postSeleccionado.descripcion} />}
                            </div>
                            <div className="modal-info">
                                <div className="post-header">
                                    <div className="post-user">
                                        <span className="post-avatar">👤</span>
                                        <div>
                                            <span className="post-username">{obtenerNombreUsuario(postSeleccionado.usuario)}</span>
                                            <span className="post-date">{formatearFechaCompleta(postSeleccionado.fecha)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="post-description">
                                    <p>{postSeleccionado.descripcion}</p>
                                    {postSeleccionado.tipo === 'video' && <p className="post-type">🎬 Video</p>}
                                </div>
                                {postSeleccionado.cancion && (
                                    <div className="post-music">
                                        <div className="music-player">
                                            {getYouTubeId(postSeleccionado.cancion) && <iframe className="youtube-embed" src={\`https://www.youtube.com/embed/\${getYouTubeId(postSeleccionado.cancion)}\`} title="Reproductor de música" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                                            {getSpotifyId(postSeleccionado.cancion) && <iframe className="spotify-embed" src={\`https://open.spotify.com/embed/track/\${getSpotifyId(postSeleccionado.cancion)}\`} title="Reproductor de Spotify" frameBorder="0" allow="encrypted-media" />}
                                            {!getYouTubeId(postSeleccionado.cancion) && !getSpotifyId(postSeleccionado.cancion) && <a href={postSeleccionado.cancion} target="_blank" rel="noopener noreferrer" className="music-link">🎵 Escuchar canción</a>}
                                        </div>
                                    </div>
                                )}
                                <div className="post-actions">
                                    <button className={\`action-like \${postSeleccionado.likedBy && postSeleccionado.likedBy[usuario] ? 'liked' : ''}\`} onClick={() => likeHandler(postSeleccionado.id)}>
                                        {postSeleccionado.likedBy && postSeleccionado.likedBy[usuario] ? '❤️' : '🤍'} {postSeleccionado.likes || 0}
                                    </button>
                                    <span className="action-comment">💬 {comentarios.length}</span>
                                </div>
                                <div className="comments-section">
                                    <h4>Comentarios</h4>
                                    <div className="comments-list" ref={comentariosRef}>
                                        {cargandoComentarios ? <div className="loading-comments">Cargando comentarios...</div> : comentarios.length === 0 ? <div className="no-comments">💭 No hay comentarios aún. ¡Sé el primero!</div> : comentarios.map((com) => (
                                            <div key={com.id} className="comment-item">
                                                <span className="comment-user">{obtenerNombreUsuario(com.usuario)}</span>
                                                <span className="comment-text">{com.texto}</span>
                                                <span className="comment-time">{formatearHora(com.fecha)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="comment-input-area">
                                        <input type="text" placeholder="Escribe un comentario..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault();
                                                enviarComentario(); } }} maxLength="300" />
                                        <button onClick={enviarComentario} disabled={!nuevoComentario.trim()}>Publicar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Album;`;

// 8. Album.css
const albumCss = `.album-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 30px;
    padding: 25px;
    box-shadow: 0 20px 60px rgba(107, 47, 160, 0.15);
    min-height: 90vh;
}
.album-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0ece8;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 10px;
}
.album-header h1 {
    font-size: 1.8em;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
}
.user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #f0f4f0, #f4f0f8);
    padding: 8px 18px;
    border-radius: 50px;
}
.user-avatar { font-size: 1.2em; }
.user-name { font-weight: 600; color: #6B2FA0; }
.online-status {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}
.online-status.online { background: #2ECC71; box-shadow: 0 0 10px #2ECC71; }
.online-status.offline { background: #e74c3c; }
.logout-btn {
    padding: 6px 16px;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 0.85em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
}
.logout-btn:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(192, 57, 43, 0.3); }
.tabs-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    background: #f8f4f0;
    border-radius: 15px;
    padding: 5px;
}
.tab-btn {
    flex: 1;
    padding: 12px 20px;
    border: none;
    background: transparent;
    border-radius: 12px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    color: #7f8c8d;
}
.tab-btn.active {
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    color: white;
    box-shadow: 0 5px 15px rgba(107, 47, 160, 0.3);
}
.tab-btn:hover:not(.active) { background: rgba(107, 47, 160, 0.08); }
.upload-area {
    background: linear-gradient(135deg, #f8fcf9, #f8f4fc);
    border: 2px dashed #c8b8d8;
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 25px;
    transition: all 0.3s;
}
.upload-area:hover { border-color: #8E44AD;
    background: linear-gradient(135deg, #f0fcf5, #f4ecfc); }
.upload-content { display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px; }
.upload-title { color: #6B2FA0;
    font-weight: 500;
    margin-bottom: 5px;
    font-size: 1.1em; }
.upload-input-group { display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%; }
.file-input-hidden { display: none; }
.upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #2ECC71, #27AE60);
    color: white;
    padding: 12px 30px;
    border-radius: 50px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
}
.upload-btn:hover { transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(46, 204, 113, 0.3); }
.file-count { color: #7f8c8d;
    font-size: 0.9em;
    background: #ecf0f1;
    padding: 5px 15px;
    border-radius: 20px; }
.preview-container {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px;
    background: white;
    border-radius: 15px;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    position: relative;
}
.preview-item { width: 80px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid #e8e0f0;
    flex-shrink: 0; }
.preview-item img { width: 100%;
    height: 100%;
    object-fit: cover; }
.preview-video {
    width: 100%;
    max-height: 200px;
    border-radius: 10px;
}
.remove-preview-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(192, 57, 43, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.3s;
}
.remove-preview-btn:hover { background: #c0392b;
    transform: scale(1.1); }
.video-local-group {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    flex-wrap: wrap;
}
.video-local-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #8E44AD, #6B2FA0);
    color: white;
    padding: 10px 25px;
    border-radius: 50px;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
}
.video-local-btn:hover { transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(107, 47, 160, 0.3); }
.video-uploading { color: #6B2FA0;
    font-weight: 500;
    font-size: 0.85em;
    animation: pulse 1s infinite; }
@keyframes pulse {
    0%,
    100% { opacity: 1; }
    50% { opacity: 0.5; }
}
.desc-input {
    width: 100%;
    max-width: 400px;
    padding: 10px 18px;
    border: 2px solid #e8e0f0;
    border-radius: 15px;
    font-size: 0.95em;
    outline: none;
    transition: all 0.3s;
    background: white;
}
.desc-input:focus { border-color: #8E44AD;
    box-shadow: 0 0 0 4px rgba(142, 68, 173, 0.1); }
.cancion-input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    background: white;
    border: 2px solid #e8e0f0;
    border-radius: 15px;
    padding: 0 15px;
    transition: all 0.3s;
}
.cancion-input-group:focus-within { border-color: #8E44AD;
    box-shadow: 0 0 0 4px rgba(142, 68, 173, 0.1); }
.cancion-icon { font-size: 1.2em;
    color: #8E44AD;
    flex-shrink: 0; }
.cancion-input { flex: 1;
    padding: 10px 0;
    border: none;
    outline: none;
    font-size: 0.95em;
    background: transparent; }
.cancion-preview { font-size: 0.7em;
    color: #27AE60;
    font-weight: 600;
    background: #d5f5e3;
    padding: 4px 10px;
    border-radius: 12px;
    white-space: nowrap;
    flex-shrink: 0; }
.upload-submit-btn {
    padding: 14px 40px;
    background: linear-gradient(135deg, #8E44AD, #6B2FA0);
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1.05em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    justify-content: center;
    max-width: 400px;
}
.upload-submit-btn:hover:not(:disabled) { transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(107, 47, 160, 0.4); }
.upload-submit-btn:disabled { opacity: 0.5;
    cursor: not-allowed; }
.upload-submit-btn .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
.upload-message {
    padding: 12px 20px;
    border-radius: 15px;
    font-weight: 500;
    width: 100%;
    max-width: 400px;
    text-align: center;
    animation: fadeIn 0.3s ease;
}
.upload-message.success { background: #d5f5e3;
    color: #1a7a3a;
    border: 1px solid #82e0aa; }
.upload-message.error { background: #fde8e8;
    color: #c0392b;
    border: 1px solid #f5c6c6; }
.upload-message.info { background: #ebdef0;
    color: #6B2FA0;
    border: 1px solid #d2b4de; }
.posts-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
}
.post-card {
    position: relative;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    cursor: pointer;
}
.post-card:hover { transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(107, 47, 160, 0.15); }
.post-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
}
.video-thumbnail {
    position: relative;
    width: 100%;
    height: 200px;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
}
.video-thumbnail-player {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.video-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3em;
    color: white;
    text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    opacity: 0.8;
    transition: all 0.3s;
}
.post-card:hover .video-play-icon { opacity: 1;
    transform: translate(-50%, -50%) scale(1.1); }
.music-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(107, 47, 160, 0.9);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    z-index: 2;
}
.video-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(231, 76, 60, 0.9);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    z-index: 2;
}
.post-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    opacity: 0;
    transition: all 0.3s;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
}
.post-card:hover .post-overlay { opacity: 1; }
.delete-btn {
    background: rgba(192, 57, 43, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.delete-btn:hover { background: #c0392b;
    transform: scale(1.1); }
.post-stats {
    display: flex;
    gap: 12px;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
}
.post-stats .stat { color: white;
    font-size: 0.8em;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px; }
.post-info { padding: 10px 12px; }
.post-desc { font-size: 0.85em;
    color: #2c3e50;
    word-break: break-word;
    margin-bottom: 3px; }
.post-music { font-size: 0.7em;
    color: #8E44AD;
    font-weight: 500;
    margin: 2px 0; }
.post-type { font-size: 0.7em;
    color: #e74c3c;
    font-weight: 500; }
.post-date { font-size: 0.7em;
    color: #95a5a6; }
.post-user { font-size: 0.65em;
    color: #8E44AD;
    display: block;
    margin-top: 2px;
    font-weight: 500; }
.chat-container {
    display: flex;
    flex-direction: column;
    height: 500px;
}
.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #eef2f5;
    margin-bottom: 10px;
}
.chat-header h3 { color: #6B2FA0;
    font-weight: 500; }
.chat-online-users { font-size: 0.85em;
    color: #7f8c8d; }
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background: #f8fcf9;
    border-radius: 15px;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid #e8e0f0;
}
.message {
    max-width: 80%;
    animation: fadeIn 0.3s ease;
}
.message.mine { align-self: flex-end; }
.message.hers { align-self: flex-start; }
.message-content {
    padding: 10px 16px;
    border-radius: 18px;
    word-wrap: break-word;
}
.message.mine .message-content {
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    color: white;
    border-bottom-right-radius: 5px;
}
.message.hers .message-content {
    background: linear-gradient(135deg, #2ECC71, #27AE60);
    color: white;
    border-bottom-left-radius: 5px;
}
.message-sender {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 0.75em;
    opacity: 0.8;
}
.sender-name { font-weight: 600; }
.sender-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}
.sender-status.online { background: #2ECC71; }
.sender-status.offline { background: #95a5a6; }
.message-text { font-size: 0.95em;
    margin: 0; }
.message-time { font-size: 0.65em;
    opacity: 0.7;
    display: block;
    margin-top: 3px; }
.chat-input-area {
    display: flex;
    gap: 10px;
}
.chat-input-area input {
    flex: 1;
    padding: 12px 18px;
    border: 2px solid #e8e0f0;
    border-radius: 25px;
    font-size: 0.95em;
    outline: none;
    transition: all 0.3s;
    background: white;
}
.chat-input-area input:focus { border-color: #8E44AD;
    box-shadow: 0 0 0 4px rgba(142, 68, 173, 0.1); }
.send-btn {
    padding: 12px 25px;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}
.send-btn:hover { transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(107, 47, 160, 0.3); }
.send-icon { font-size: 1.1em; }
.loading-state {
    grid-column: 1/-1;
    text-align: center;
    padding: 40px;
    color: #95a5a6;
}
.loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #8E44AD;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
}
.empty-state {
    grid-column: 1/-1;
    text-align: center;
    padding: 50px 20px;
    color: #95a5a6;
}
.empty-icon { font-size: 4em;
    display: block;
    margin-bottom: 15px; }
.empty-state h3 { color: #6B2FA0;
    margin-bottom: 5px; }
.empty-state p { margin-bottom: 15px; }
.empty-chat { text-align: center;
    padding: 40px;
    color: #95a5a6; }
.empty-chat .empty-icon { font-size: 3em;
    display: block;
    margin-bottom: 10px; }

/* ===== MODAL ===== */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    animation: fadeIn 0.3s ease;
}
.modal-content {
    background: white;
    border-radius: 20px;
    max-width: 900px;
    width: 100%;
    max-height: 95vh;
    position: relative;
    overflow: hidden;
    animation: slideUp 0.3s ease;
}
@keyframes slideUp {
    from { transform: translateY(30px);
        opacity: 0; }
    to { transform: translateY(0);
        opacity: 1; }
}
.modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 1.2em;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.modal-close:hover { background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1); }
.modal-body {
    display: flex;
    flex-direction: row;
    height: 100%;
    max-height: 85vh;
}
.modal-image {
    flex: 1.2;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    min-height: 400px;
}
.modal-image img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
}
.modal-video {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
}
.modal-info {
    flex: 0.8;
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: white;
    min-width: 300px;
    max-width: 400px;
}
.post-header {
    display: flex;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #eef2f5;
}
.post-user { display: flex;
    align-items: center;
    gap: 10px; }
.post-avatar { font-size: 2em; }
.post-username {
    font-weight: 700;
    background: linear-gradient(135deg, #6B2FA0, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: block;
}
.post-date { font-size: 0.75em;
    color: #7f8c8d;
    display: block; }
.post-description {
    padding: 12px 0;
    border-bottom: 1px solid #eef2f5;
    flex-shrink: 0;
}
.post-description p { font-size: 0.95em;
    color: #2c3e50;
    line-height: 1.5;
    margin: 0; }
.post-music {
    padding: 10px 0;
    border-bottom: 1px solid #eef2f5;
    flex-shrink: 0;
}
.music-player { width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: #f8f4f0; }
.youtube-embed { width: 100%;
    height: 200px;
    border-radius: 12px; }
.spotify-embed { width: 100%;
    height: 80px;
    border-radius: 12px; }
.music-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px 20px;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 500;
    transition: all 0.3s;
}
.music-link:hover { transform: scale(1.02);
    box-shadow: 0 5px 15px rgba(107, 47, 160, 0.3); }
.post-actions {
    display: flex;
    gap: 20px;
    padding: 12px 0;
    border-bottom: 1px solid #eef2f5;
    flex-shrink: 0;
}
.action-like {
    background: none;
    border: none;
    font-size: 1.1em;
    cursor: pointer;
    transition: all 0.3s;
    padding: 4px 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #7f8c8d;
}
.action-like.liked { color: #e74c3c; }
.action-like:hover { background: #f0f2f5; }
.action-comment { font-size: 1.1em;
    color: #7f8c8d;
    display: flex;
    align-items: center;
    gap: 4px; }
.comments-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding-top: 12px;
}
.comments-section h4 {
    font-size: 0.9em;
    background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
    font-weight: 600;
}
.comments-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    margin-bottom: 10px;
}
.comments-list::-webkit-scrollbar { width: 4px; }
.comments-list::-webkit-scrollbar-track { background: #f0f2f5;
    border-radius: 4px; }
.comments-list::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #6B2FA0, #8E44AD);
    border-radius: 4px; }
.loading-comments { text-align: center;
    color: #95a5a6;
    font-size: 0.9em;
    padding: 20px 0; }
.no-comments { text-align: center;
    color: #95a5a6;
    font-size: 0.9em;
    padding: 20px 0; }
.comment-item {
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f5;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px;
}
.comment-item:last-child { border-bottom: none; }
.comment-user {
    font-weight: 700;
    background: linear-gradient(135deg, #6B2FA0, #2ECC71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 0.9em;
}
.comment-text { color: #2c3e50;
    font-size: 0.9em;
    word-break: break-word;
    flex: 1; }
.comment-time { font-size: 0.65em;
    color: #95a5a6;
    margin-left: 4px; }
.comment-input-area {
    display: flex;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #eef2f5;
    flex-shrink: 0;
}
.comment-input-area input {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid #e8e0f0;
    border-radius: 20px;
    font-size: 0.9em;
    outline: none;
    transition: all 0.3s;
    background: #f8f4f0;
}
.comment-input-area input:focus { border-color: #8E44AD;
    background: white; }
.comment-input-area button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #8E44AD, #6B2FA0);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 0.9em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
}
.comment-input-area button:hover:not(:disabled) { transform: scale(1.02);
    box-shadow: 0 5px 15px rgba(107, 47, 160, 0.3); }
.comment-input-area button:disabled { opacity: 0.5;
    cursor: not-allowed; }
@keyframes fadeIn {
    from { opacity: 0;
        transform: translateY(10px); }
    to { opacity: 1;
        transform: translateY(0); }
}

@media (max-width: 768px) {
    .album-container { padding: 15px;
        border-radius: 20px;
        min-height: 95vh; }
    .album-header h1 { font-size: 1.4em; }
    .post-card img,
    .video-thumbnail { height: 150px; }
    .posts-gallery { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
    .modal-body { flex-direction: column; }
    .modal-image { min-height: 250px;
        padding: 10px; }
    .modal-image img,
    .modal-video { max-height: 40vh; }
    .modal-info { flex: 1;
        min-width: unset;
        max-width: unset;
        padding: 15px; }
    .modal-content { max-height: 98vh; }
    .modal-close { top: 8px;
        right: 8px;
        width: 30px;
        height: 30px;
        font-size: 1em; }
    .youtube-embed { height: 160px; }
    .chat-container { height: 420px; }
}
@media (max-width: 480px) {
    .album-container { padding: 10px;
        border-radius: 15px; }
    .album-header { flex-direction: column;
        align-items: flex-start; }
    .album-header h1 { font-size: 1.2em; }
    .user-info { padding: 6px 14px;
        font-size: 0.9em; }
    .posts-gallery { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px; }
    .post-card img,
    .video-thumbnail { height: 120px; }
    .chat-container { height: 380px; }
    .message { max-width: 90%; }
    .message-content { font-size: 0.9em;
        padding: 8px 12px; }
    .chat-input-area { flex-wrap: wrap; }
    .chat-input-area input { flex: 1;
        min-width: 120px; }
    .send-btn { flex: 1;
        justify-content: center;
        min-width: 80px; }
    .modal-image { min-height: 180px; }
    .modal-image img,
    .modal-video { max-height: 30vh; }
    .youtube-embed { height: 120px; }
    .spotify-embed { height: 60px; }
}`;

// ============================================================
// LISTA DE ARCHIVOS A CREAR
// ============================================================
const files = [
    { path: 'src/firebase.js', content: firebaseJs },
    { path: 'src/config/supabase.js', content: supabaseJs },
    { path: 'src/components/Login.js', content: loginJs },
    { path: 'src/components/Login.css', content: loginCss },
    { path: 'src/components/Register.js', content: registerJs },
    { path: 'src/components/Register.css', content: registerCss },
    { path: 'src/components/Album.js', content: albumJs },
    { path: 'src/components/Album.css', content: albumCss },
];

// ============================================================
// CREAR ARCHIVOS
// ============================================================
console.log('🚀 Creando archivos del proyecto...\n');

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Creada carpeta: ${dir}`);
    }
    
    fs.writeFileSync(fullPath, file.content);
    console.log(`✅ Creado: ${file.path}`);
});

console.log('\n🎉 ¡Todos los archivos creados con éxito!');
console.log('\n📋 RECUERDA:');
console.log('1. Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY en src/config/supabase.js');
console.log('2. Crea el bucket "videos" en Supabase Storage');
console.log('3. Configura las políticas del bucket como públicas');
console.log('\n🚀 Inicia el proyecto: npm start');
console.log('\n💚💜 ¡Disfruta tu álbum de amor!');