// src/pages/RegistroAccesoPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, Hash } from 'lucide-react';
import { accesosService, ciclosService, estudiantesService, asistenciaService } from '../api/services';
import '../styles/registro-acceso.css';

const RegistroAccesoPage = () => {
    const [nfcInput, setNfcInput] = useState('');
    const [ultimoAcceso, setUltimoAcceso] = useState(null);
    const [estado, setEstado] = useState('esperando'); // esperando, exito, error, duplicado
    const [mensaje, setMensaje] = useState('Acerque la tarjeta NFC al lector...');
    const [historialHoy, setHistorialHoy] = useState([]);
    const [modoManual, setModoManual] = useState(false);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Estados para registro por matrícula
    const [matriculaInput, setMatriculaInput] = useState('');
    const [isRegistrandoMatricula, setIsRegistrandoMatricula] = useState(false);

    const inputRef = useRef(null);
    const matriculaInputRef = useRef(null);
    const timeoutRef = useRef(null);

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
            const resultado = await asistenciaService.registrarPorMatricula(matriculaInput.trim());

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
        <div className="registro-acceso-container">
            <div className="registro-acceso-main">
                <h1 className="page-title">Registro de Accesos</h1>

                {/* Panel de configuración de modo prueba */}
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
                    )}
                </div>

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
                        {Array.isArray(historialHoy) && historialHoy.slice(0, 15).map((asistencia, index) => (
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
                                    {typeof asistencia.estudiante.grupo === 'object'
                                        ? asistencia.estudiante.grupo?.nombre || 'Sin grupo'
                                        : asistencia.estudiante.grupo || 'Sin grupo'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistroAccesoPage;
