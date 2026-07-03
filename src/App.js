import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Album from './components/Album';
import { setUserOnline, setUserOffline } from './firebase';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [mostrarRegistro, setMostrarRegistro] = useState(false);

    useEffect(() => {
        const userSaved = localStorage.getItem('usuarioApp');
        if (userSaved) {
            setUsuario(userSaved);
            setUserOnline(userSaved);
        }
    }, []);

    const handleLogin = async (nombre) => {
        setUsuario(nombre);
        localStorage.setItem('usuarioApp', nombre);
        await setUserOnline(nombre);
    };

    const handleLogout = async () => {
        await setUserOffline(usuario);
        setUsuario(null);
        localStorage.removeItem('usuarioApp');
    };

    if (usuario) {
        return <Album usuario={usuario} onLogout={handleLogout} />;
    }

    return (
        <div className="App">
            {!mostrarRegistro ? (
                <Login
                    onLogin={handleLogin}
                    onRegisterClick={() => setMostrarRegistro(true)}
                />
            ) : (
                <Register
                    onRegisterSuccess={() => setMostrarRegistro(false)}
                    onBackToLogin={() => setMostrarRegistro(false)}
                />
            )}
        </div>
    );
}

export default App;