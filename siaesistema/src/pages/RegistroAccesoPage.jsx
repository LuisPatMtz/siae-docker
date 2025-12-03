// src/pages/RegistroAccesoPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, Hash } from 'lucide-react';
import { accesosService, ciclosService, estudiantesService, asistenciaService } from '../api/services';
import { useAuth } from '../components/Auth/AuthContext';
import PageContainer from '../components/Common/PageContainer.jsx';
import '../styles/registro-acceso.css';

// Helper: El backend envía timestamps sin timezone (ya en hora de México)
// JavaScript los interpreta como UTC, así que necesitamos tratarlos como locales
const parseLocalTimestamp = (isoString) => {
    // Agregar 'Z' haría que se interprete como UTC, lo cual NO queremos
    // En su lugar, parseamos manualmente para tratarlo como hora local
    const date = new Date(isoString);
    // El timestamp ya viene en hora de México, así que lo usamos directamente
    return date;
};

const RegistroAccesoPage = () => {
    const { hasPermission } = useAuth();
    const [nfcInput, setNfcInput] = useState('');
    const [ultimoAcceso, setUltimoAcceso] = useState(null);
    const [estado, setEstado] = useState('esperando'); // esperando, exito, error, duplicado
    const [mensaje, setMensaje] = useState('Acerque la tarjeta NFC al lector...');
    const [historialHoy, setHistorialHoy] = useState([]);
    const [modoManual, setModoManual] = useState(false);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [horaSeleccionada, setHoraSeleccionada] = useState(''); // Hora específica HH:MM:SS

    // Estados para registro por matrícula
    const [matriculaInput, setMatriculaInput] = useState('');
    const [isRegistrandoMatricula, setIsRegistrandoMatricula] = useState(false);

    const inputRef = useRef(null);
    const matriculaInputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Verificar si el usuario tiene permiso de mantenimiento
    const tienePermisoMantenimiento = hasPermission('canManageMaintenance');

    // Mantener el foco en el input NFC solo cuando no se está usando el input de matrícula
    useEffect(() => {
        const intervalId = setInterval(() => {
            // No forzar foco si el usuario está en el input de matrícula o en un botón
            const activeElement = document.activeElement;
            const isMatriculaInput = activeElement === matriculaInputRef.current;
            const isButton = activeElement?.tagName === 'BUTTON';
            const isInput = activeElement?.tagName === 'INPUT' && activeElement !== inputRef.current;

            if (inputRef.current && !isMatriculaInput && !isButton && !isInput) {
                inputRef.current.focus();
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, []);

    // Cargar historial del día al iniciar
    useEffect(() => {
        cargarHistorialHoy();
    }, []);

    const cargarHistorialHoy = async () => {
        try {
            // Cargar asistencias (entrada/salida por matrícula)
            const asistencias = await asistenciaService.getAsistenciasHoy();
            setHistorialHoy(asistencias);
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    };

    const registrarAcceso = async (nfcUid) => {
        try {
            setEstado('procesando');
            setMensaje('Registrando acceso...');

            // Si está en modo prueba y hay una hora programada, esperar hasta esa hora
            if (modoManual && horaSeleccionada) {
                const ahora = new Date();
                const [horas, minutos, segundos] = horaSeleccionada.split(':').map(Number);
                
                const horaObjetivo = new Date();
                horaObjetivo.setHours(horas, minutos, segundos || 0, 0);
                
                const diferenciaMilisegundos = horaObjetivo.getTime() - ahora.getTime();
                
                if (diferenciaMilisegundos > 0) {
                    const segundosRestantes = Math.ceil(diferenciaMilisegundos / 1000);
                    setMensaje(`Esperando hasta las ${horaSeleccionada} (${segundosRestantes}s restantes)...`);
                    
                    // Actualizar countdown cada segundo
                    const intervalo = setInterval(() => {
                        const tiempoRestante = horaObjetivo.getTime() - new Date().getTime();
                        const segsRestantes = Math.ceil(tiempoRestante / 1000);
                        if (segsRestantes > 0) {
                            setMensaje(`Esperando hasta las ${horaSeleccionada} (${segsRestantes}s restantes)...`);
                        }
                    }, 1000);
                    
                    await new Promise(resolve => setTimeout(resolve, diferenciaMilisegundos));
                    clearInterval(intervalo);
                    setMensaje('Registrando acceso...');
                } else if (diferenciaMilisegundos < -5000) {
                    // Si la hora ya pasó por más de 5 segundos, mostrar advertencia
                    setEstado('error');
                    setMensaje('La hora programada ya pasó. Ajusta la hora o desactiva el modo prueba.');
                    setTimeout(() => {
                        setEstado('esperando');
                        setMensaje('Acerque la tarjeta NFC al lector...');
                    }, 4000);
                    return;
                }
            }

            // Usar la fecha seleccionada si está en modo manual
            const fechaParaRegistro = modoManual ? fechaSeleccionada : null;
            const acceso = await accesosService.registrar(nfcUid, fechaParaRegistro);

            // Usar la información del estudiante que viene en la respuesta
            setEstado('exito');
            setUltimoAcceso({
                estudiante: acceso.estudiante,
                hora: new Date(acceso.timestamp).toLocaleTimeString('es-MX'),
                fecha: new Date(acceso.timestamp).toLocaleDateString('es-MX'),
                tipo: acceso.tipo
            });
            setMensaje('¡Acceso registrado exitosamente!');

            // Recargar historial
            cargarHistorialHoy();

            // Resetear después de 3 segundos
            setTimeout(() => {
                setEstado('esperando');
                setMensaje('Acerque la tarjeta NFC al lector...');
                setUltimoAcceso(null);
            }, 3000);

        } catch (error) {
            // Manejar error de acceso duplicado de manera especial
            if (error.response?.status === 409) {
                setEstado('duplicado');
                setMensaje(error.response.data.detail || 'Ya se registró un acceso hoy para este estudiante.');

                // Intentar obtener el estudiante para mostrar su información
                const estudiantes = await estudiantesService.getAll();
                const estudiante = estudiantes.find(est => est.nfc?.nfc_uid === nfcUid);

                if (estudiante) {
                    setUltimoAcceso({
                        estudiante: estudiante,
                        hora: null,
                        fecha: new Date().toLocaleDateString('es-MX')
                    });
                }

                setTimeout(() => {
                    setEstado('esperando');
                    setMensaje('Acerque la tarjeta NFC al lector...');
                    setUltimoAcceso(null);
                }, 4000);
            } else {
                // Otros errores
                setEstado('error');

                if (error.response?.status === 404) {
                    setMensaje('Tarjeta NFC no reconocida. Por favor, vincule la tarjeta primero.');
                } else if (error.response?.status === 400) {
                    setMensaje(error.response.data.detail || 'No hay ciclo escolar activo.');
                } else {
                    setMensaje('Error al registrar el acceso. Intente nuevamente.');
                }

                setTimeout(() => {
                    setEstado('esperando');
                    setMensaje('Acerque la tarjeta NFC al lector...');
                }, 4000);
            }
        }
    };

    const registrarAsistenciaPorMatricula = async () => {
        if (!matriculaInput.trim()) {
            setEstado('error');
            setMensaje('Por favor ingrese una matrícula válida.');
            setTimeout(() => {
                setEstado('esperando');
                setMensaje('Acerque la tarjeta NFC al lector...');
            }, 3000);
            return;
        }

        setIsRegistrandoMatricula(true);
        setEstado('procesando');
        setMensaje('Registrando asistencia...');

        try {
            // Construir timestamp programado si está en modo prueba
            let timestampProgramado = null;
            if (modoManual && (fechaSeleccionada || horaSeleccionada)) {
                const fecha = fechaSeleccionada || new Date().toISOString().split('T')[0];
                const hora = horaSeleccionada || new Date().toTimeString().slice(0, 8);
                timestampProgramado = `${fecha}T${hora}`;
                
                // En modo prueba, registrar directamente con el timestamp programado
                // sin esperar, ya que puede ser una fecha/hora pasada
                setMensaje(`Registrando con fecha/hora: ${fecha} ${hora}...`);
            } else if (horaSeleccionada && !modoManual) {
                // Si solo hay hora programada pero NO está en modo prueba, esperar
                const ahora = new Date();
                const [horas, minutos, segundos] = horaSeleccionada.split(':').map(Number);
                
                const horaObjetivo = new Date();
                horaObjetivo.setHours(horas, minutos, segundos || 0, 0);
                
                const diferenciaMilisegundos = horaObjetivo.getTime() - ahora.getTime();
                
                if (diferenciaMilisegundos > 0) {
                    const segundosRestantes = Math.ceil(diferenciaMilisegundos / 1000);
                    setMensaje(`Esperando hasta las ${horaSeleccionada} (${segundosRestantes}s restantes)...`);
                    
                    const intervalo = setInterval(() => {
                        const tiempoRestante = horaObjetivo.getTime() - new Date().getTime();
                        const segsRestantes = Math.ceil(tiempoRestante / 1000);
                        if (segsRestantes > 0) {
                            setMensaje(`Esperando hasta las ${horaSeleccionada} (${segsRestantes}s restantes)...`);
                        }
                    }, 1000);
                    
                    await new Promise(resolve => setTimeout(resolve, diferenciaMilisegundos));
                    clearInterval(intervalo);
                    setMensaje('Registrando asistencia...');
                } else if (diferenciaMilisegundos < -5000) {
                    setEstado('error');
                    setMensaje('La hora programada ya pasó. Ajusta la hora o desactiva el modo prueba.');
                    setIsRegistrandoMatricula(false);
                    setTimeout(() => {
                        setEstado('esperando');
                        setMensaje('Acerque la tarjeta NFC al lector...');
                    }, 4000);
                    return;
                }
            }

            const resultado = await asistenciaService.registrarPorMatricula(
                matriculaInput.trim(),
                timestampProgramado
            );

            setEstado('exito');
            setUltimoAcceso({
                estudiante: resultado.estudiante,
                hora: new Date(resultado.timestamp).toLocaleTimeString('es-MX'),
                fecha: new Date(resultado.timestamp).toLocaleDateString('es-MX'),
                tipo: resultado.tipo // 'entrada' o 'salida'
            });
            setMensaje(resultado.mensaje);

            // Limpiar input
            setMatriculaInput('');

            // Recargar historial
            cargarHistorialHoy();

            // Resetear después de 3 segundos
            setTimeout(() => {
                setEstado('esperando');
                setMensaje('Acerque la tarjeta NFC al lector...');
                setUltimoAcceso(null);
            }, 3000);

        } catch (error) {
            setEstado('error');

            if (error.response?.status === 404) {
                setMensaje('Estudiante no encontrado. Verifique la matrícula.');
            } else {
                setMensaje(error.response?.data?.detail || 'Error al registrar asistencia. Intente nuevamente.');
            }

            setTimeout(() => {
                setEstado('esperando');
                setMensaje('Acerque la tarjeta NFC al lector...');
            }, 4000);
        } finally {
            setIsRegistrandoMatricula(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Soporta tarjetas (8) y stickers (14)
            if (value.length >= 8) {
                const uid = value.substring(0, Math.min(value.length, 14));
                // Validar formato hexadecimal de 8 a 14 caracteres
                if (/^[0-9A-F]{8,14}$/.test(uid)) {
                    registrarAcceso(uid);
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                }
            }
        }, 100);
    };

    const handleMatriculaKeyPress = (e) => {
        if (e.key === 'Enter') {
            registrarAsistenciaPorMatricula();
        }
    };

    return (
        <PageContainer>
            <div className="registro-acceso-container">
                <div className="registro-acceso-main">
                    <h1 className="page-title">Registro de Accesos</h1>

                {/* Panel de configuración de modo prueba - Solo visible para personal de mantenimiento */}
                {tienePermisoMantenimiento && (
                    <div className="modo-prueba-panel">
                        <div className="modo-toggle">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={modoManual}
                                    onChange={(e) => setModoManual(e.target.checked)}
                                />
                                <span className="toggle-text">
                                    {modoManual ? 'Modo de pruebas' : 'Modo normal'}
                                </span>
                            </label>
                        </div>

                        {modoManual && (
                            <>
                                <div className="fecha-selector">
                                    <label htmlFor="fecha-registro">
                                        Fecha para registro:
                                    </label>
                                    <input
                                        type="date"
                                        id="fecha-registro"
                                        value={fechaSeleccionada}
                                        onChange={(e) => setFechaSeleccionada(e.target.value)}
                                        className="input-fecha"
                                    />
                                </div>
                                
                                <div className="hora-selector">
                                    <label htmlFor="hora-registro">
                                        Hora programada (HH:MM:SS):
                                    </label>
                                    <input
                                        type="time"
                                        id="hora-registro"
                                        value={horaSeleccionada}
                                        onChange={(e) => setHoraSeleccionada(e.target.value)}
                                        step="1"
                                        className="input-hora"
                                        placeholder="HH:MM:SS"
                                    />
                                    <span className="hora-hint">
                                        {horaSeleccionada 
                                            ? `Se registrará a las ${horaSeleccionada}` 
                                            : 'Sin hora programada (registro inmediato)'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Sección de registro por matrícula */}
                <div className="matricula-registro-section">
                    <h3 className="section-subtitle">
                        <Hash size={20} />
                        Registro por Matrícula
                    </h3>
                    <div className="matricula-input-group">
                        <input
                            ref={matriculaInputRef}
                            type="text"
                            value={matriculaInput}
                            onChange={(e) => setMatriculaInput(e.target.value)}
                            onKeyPress={handleMatriculaKeyPress}
                            placeholder="Ingrese matrícula del estudiante"
                            className="matricula-input"
                            disabled={isRegistrandoMatricula}
                        />
                        <button
                            onClick={registrarAsistenciaPorMatricula}
                            disabled={isRegistrandoMatricula || !matriculaInput.trim()}
                            className="btn-registrar-matricula"
                        >
                            {isRegistrandoMatricula ? 'Registrando...' : 'Registrar Asistencia'}
                        </button>
                    </div>
                </div>

                {/* Input oculto para captura NFC */}
                <input
                    ref={inputRef}
                    type="text"
                    onChange={handleInputChange}
                    autoFocus
                    autoComplete="off"
                    maxLength={14}
                    className="nfc-capture-input"
                    placeholder="Lector NFC activo..."
                />

                {/* Panel principal de estado */}
                <div className={`acceso-panel ${estado}`}>
                    <div className="acceso-icon">
                        {estado === 'esperando' && <Clock size={80} />}
                        {estado === 'exito' && <CheckCircle size={80} />}
                        {estado === 'error' && <XCircle size={80} />}
                        {estado === 'duplicado' && (
                            <div className="duplicado-icon">⚠️</div>
                        )}
                        {estado === 'procesando' && (
                            <div className="spinner-large"></div>
                        )}
                    </div>

                    <h2 className="acceso-mensaje">{mensaje}</h2>

                    {ultimoAcceso && (estado === 'exito' || estado === 'duplicado') && (
                        <div className="acceso-detalles">
                            <div className="detalle-item">
                                <User size={20} />
                                <span>
                                    {ultimoAcceso.estudiante.nombre} {ultimoAcceso.estudiante.apellido}
                                </span>
                            </div>
                            {ultimoAcceso.tipo && (
                                <div className="detalle-item">
                                    <span className={`badge-tipo ${ultimoAcceso.tipo.toLowerCase()}`}>
                                        {ultimoAcceso.tipo === 'entrada' ? '🟢 ENTRADA' :
                                            ultimoAcceso.tipo === 'salida' ? '🔴 SALIDA' :
                                                '📱 NFC'}
                                    </span>
                                </div>
                            )}
                            {ultimoAcceso.hora && (
                                <div className="detalle-item">
                                    <Calendar size={20} />
                                    <span>{ultimoAcceso.fecha} - {ultimoAcceso.hora}</span>
                                </div>
                            )}
                            {ultimoAcceso.estudiante.grupo && (
                                <div className="detalle-item">
                                    <span className="badge-grupo">
                                        {typeof ultimoAcceso.estudiante.grupo === 'object'
                                            ? ultimoAcceso.estudiante.grupo?.nombre
                                            : ultimoAcceso.estudiante.grupo}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Historial del día */}
                <div className="historial-hoy">
                    <h3>Asistencias de Hoy ({historialHoy.length})</h3>
                    <div className="historial-lista">
                        {historialHoy.slice(0, 15).map((asistencia, index) => (
                            <div key={asistencia.id} className="historial-item">
                                <span className="historial-hora">
                                    {new Date(asistencia.timestamp).toLocaleTimeString('es-MX', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                <span className={`historial-tipo ${asistencia.tipo}`}>
                                    {asistencia.tipo === 'entrada' ? '🟢' : '🔴'}
                                </span>
                                <span className="historial-estudiante">
                                    {asistencia.estudiante.nombre} {asistencia.estudiante.apellido}
                                </span>
                                <span className="historial-grupo">
                                    {asistencia.estudiante.grupo || 'Sin grupo'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </PageContainer>
    );
};

export default RegistroAccesoPage;
