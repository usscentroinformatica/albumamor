import React, { useState } from 'react';
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
        else { setError(`❌ Error: ${result.error}`); }
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
export default Register;