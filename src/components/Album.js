import React, { useState, useEffect, useRef } from 'react';
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
        setMensajeSubida(`📸 ${files.length} foto(s) seleccionada(s)`);
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
        setMensajeSubida(`🎬 Video seleccionado: ${file.name}`);
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
                setMensajeSubida(`❌ Error al subir video: ${result.error}`);
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

        setMensajeSubida(errores === 0 ? `✅ ${subidas} archivo(s) subido(s) correctamente` : `⚠️ ${subidas} subidas, ${errores} errores`);
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
                    <span className={`online-status ${isUserOnline(usuario) ? 'online' : 'offline'}`}></span>
                    <button onClick={onLogout} className="logout-btn">🚪 Salir</button>
                </div>
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${tabActiva === 'posts' ? 'active' : ''}`} onClick={() => setTabActiva('posts')}>📸 Posts ({posts.length})</button>
                <button className={`tab-btn ${tabActiva === 'chat' ? 'active' : ''}`} onClick={() => setTabActiva('chat')}>💬 Chat ({mensajes.length})</button>
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
                                    <span className="file-count">{archivosSeleccionados.length > 0 ? `${archivosSeleccionados.length} seleccionada(s)` : 'Ninguna seleccionada'}</span>
                                </div>
                                {previewUrls.length > 0 && (
                                    <div className="preview-container">
                                        {previewUrls.map((url, index) => (<div key={index} className="preview-item"><img src={url} alt={`Vista previa ${index + 1}`} /></div>))}
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
                                {mensajeSubida && <div className={`upload-message ${mensajeSubida.includes('✅') ? 'success' : mensajeSubida.includes('❌') ? 'error' : 'info'}`}>{mensajeSubida}</div>}
                            </div>
                        </div>

                        <div className="posts-gallery">
                            {cargandoPosts ? (
                                <div className="loading-state"><div className="loading-spinner"></div><p>Cargando posts...</p></div>
                            ) : posts.length === 0 ? (
                                <div className="empty-state"><span className="empty-icon">🌅</span><h3>No hay posts aún</h3><p>Sube tu primera foto o video</p></div>
                            ) : (
                                posts.map((post) => (
                                    <div key={post.id} className={`post-card ${post.tipo === 'video' ? 'video-card' : ''}`} onClick={() => abrirModal(post)}>
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
                                        <div key={msg.id} className={`message ${msg.remitente === usuario ? 'mine' : 'hers'}`}>
                                            <div className="message-content">
                                                <div className="message-sender">
                                                    <span className="sender-name">{obtenerNombreUsuario(msg.remitente)}</span>
                                                    <span className={`sender-status ${isUserOnline(msg.remitente) ? 'online' : 'offline'}`}></span>
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
                                            {getYouTubeId(postSeleccionado.cancion) && <iframe className="youtube-embed" src={`https://www.youtube.com/embed/${getYouTubeId(postSeleccionado.cancion)}`} title="Reproductor de música" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                                            {getSpotifyId(postSeleccionado.cancion) && <iframe className="spotify-embed" src={`https://open.spotify.com/embed/track/${getSpotifyId(postSeleccionado.cancion)}`} title="Reproductor de Spotify" frameBorder="0" allow="encrypted-media" />}
                                            {!getYouTubeId(postSeleccionado.cancion) && !getSpotifyId(postSeleccionado.cancion) && <a href={postSeleccionado.cancion} target="_blank" rel="noopener noreferrer" className="music-link">🎵 Escuchar canción</a>}
                                        </div>
                                    </div>
                                )}
                                <div className="post-actions">
                                    <button className={`action-like ${postSeleccionado.likedBy && postSeleccionado.likedBy[usuario] ? 'liked' : ''}`} onClick={() => likeHandler(postSeleccionado.id)}>
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
export default Album;