import React, { useState } from 'react';
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
            setError(`❌ ${result.error}`);
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
export default Login;