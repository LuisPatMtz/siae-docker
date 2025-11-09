// src/pages/RegistroAccesoPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { accesosService, ciclosService, estudiantesService } from '../api/services';
import '../Dashboard.css';

const RegistroAccesoPage = () => {
    const [nfcInput, setNfcInput] = useState('');
    const [ultimoAcceso, setUltimoAcceso] = useState(null);
    const [estado, setEstado] = useState('esperando'); // esperando, exito, error, duplicado
    const [mensaje, setMensaje] = useState('Acerque la tarjeta NFC al lector...');
    const [historialHoy, setHistorialHoy] = useState([]);
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Mantener el foco en el input
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
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
            const hoy = new Date().toISOString().split('T')[0];
            // Obtener ciclo activo primero
            const cicloActivo = await ciclosService.getActivo();
            
            if (cicloActivo) {
                const accesos = await accesosService.getByCiclo(cicloActivo.id);
                // Filtrar solo los accesos de hoy
                const accesosHoy = accesos.filter(acceso => {
                    const fechaAcceso = new Date(acceso.hora_registro).toISOString().split('T')[0];
                    return fechaAcceso === hoy;
                });
                setHistorialHoy(accesosHoy);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    };

    const registrarAcceso = async (nfcUid) => {
        try {
            setEstado('procesando');
            setMensaje('Registrando acceso...');

            const acceso = await accesosService.registrar(nfcUid);

            // Obtener información del estudiante asociado
            const estudiantes = await estudiantesService.getAll();
            const estudiante = estudiantes.find(est => est.nfc?.nfc_uid === nfcUid);

            setEstado('exito');
            setUltimoAcceso({
                estudiante: estudiante || { nombre: 'Desconocido', apellido: '', grupo: null },
                hora: new Date(acceso.hora_registro).toLocaleTimeString('es-MX'),
                fecha: new Date(acceso.hora_registro).toLocaleDateString('es-MX')
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

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (value.length >= 8) {
                const uid = value.substring(0, 8);
                if (/^[0-9A-F]{8}$/.test(uid)) {
                    registrarAcceso(uid);
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                }
            }
        }, 100);
    };

    return (
        <div className="registro-acceso-container">
            <div className="registro-acceso-main">
                <h1 className="page-title">Registro de Accesos</h1>

                {/* Input oculto para captura NFC */}
                <input
                    ref={inputRef}
                    type="text"
                    onChange={handleInputChange}
                    autoFocus
                    autoComplete="off"
                    maxLength={8}
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
                            {ultimoAcceso.hora && (
                                <div className="detalle-item">
                                    <Calendar size={20} />
                                    <span>{ultimoAcceso.fecha} - {ultimoAcceso.hora}</span>
                                </div>
                            )}
                            {ultimoAcceso.estudiante.grupo && (
                                <div className="detalle-item">
                                    <span className="badge-grupo">
                                        {ultimoAcceso.estudiante.grupo.nombre}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Historial del día */}
                <div className="historial-hoy">
                    <h3>Accesos de Hoy ({historialHoy.length})</h3>
                    <div className="historial-lista">
                        {historialHoy.slice(0, 10).map((acceso, index) => (
                            <div key={acceso.id} className="historial-item">
                                <span className="historial-hora">
                                    {new Date(acceso.hora_registro).toLocaleTimeString('es-MX', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                <span className="historial-nfc">{acceso.nfc_uid}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistroAccesoPage;
