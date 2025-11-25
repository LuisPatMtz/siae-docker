// src/pages/HistorialAsistenciasPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, Filter, LogIn, LogOut, Clock } from 'lucide-react';
import { asistenciaService, estudiantesService, gruposService } from '../api/services';
import '../styles/historial-asistencias.css';

const HistorialAsistenciasPage = () => {
    const [registros, setRegistros] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        grupoId: '',
        matricula: '',
        fechaInicio: '',
        fechaFin: ''
    });

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);

            // Cargar todos los registros (entradas y salidas)
            const registrosData = await asistenciaService.getTodasEntradas();
            setRegistros(registrosData);

            // Cargar estudiantes y grupos para los filtros
            const [estudiantesData, gruposData] = await Promise.all([
                estudiantesService.getAll(),
                gruposService.getAll()
            ]);

            setEstudiantes(estudiantesData);
            setGrupos(gruposData);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarRegistros = () => {
        let registrosData = [...registros];

        // Agrupar entradas con sus salidas correspondientes
        const registrosAgrupados = [];
        const entradasProcesadas = new Set();

        registrosData.forEach(reg => {
            if (reg.tipo === 'entrada' && !entradasProcesadas.has(reg.id)) {
                entradasProcesadas.add(reg.id);
                
                // Buscar la salida correspondiente
                const salida = registrosData.find(r => 
                    r.tipo === 'salida' && 
                    r.entrada_relacionada_id === reg.id
                );

                registrosAgrupados.push({
                    id: reg.id,
                    entrada: reg,
                    salida: salida || null,
                    estudiante: reg.estudiante,
                    fecha: new Date(reg.timestamp),
                    es_valida: reg.es_valida
                });
            }
        });

        let registrosFiltrados = registrosAgrupados;

        // Filtrar por matrícula o nombre
        if (filtros.matricula) {
            registrosFiltrados = registrosFiltrados.filter(reg => {
                const estudiante = reg.estudiante;
                if (!estudiante) return false;

                const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase();
                const busqueda = filtros.matricula.toLowerCase();

                return estudiante.matricula.toLowerCase().includes(busqueda) ||
                    nombreCompleto.includes(busqueda);
            });
        }

        // Filtrar por grupo
        if (filtros.grupoId) {
            registrosFiltrados = registrosFiltrados.filter(reg => {
                const estudiante = reg.estudiante;
                if (!estudiante) return false;
                const estudianteLocal = estudiantes.find(e => e.matricula === estudiante.matricula);
                return estudianteLocal && estudianteLocal.id_grupo === parseInt(filtros.grupoId);
            });
        }

        // Filtrar por rango de fechas
        if (filtros.fechaInicio) {
            registrosFiltrados = registrosFiltrados.filter(reg => {
                const fechaReg = reg.fecha.toISOString().split('T')[0];
                return fechaReg >= filtros.fechaInicio;
            });
        }

        if (filtros.fechaFin) {
            registrosFiltrados = registrosFiltrados.filter(reg => {
                const fechaReg = reg.fecha.toISOString().split('T')[0];
                return fechaReg <= filtros.fechaFin;
            });
        }

        return registrosFiltrados;
    };

    const exportarCSV = () => {
        const registrosFiltrados = filtrarRegistros();

        const headers = ['Fecha', 'Hora Entrada', 'Hora Salida', 'Matrícula', 'Nombre', 'Grupo', 'Estado'];
        const rows = registrosFiltrados.map(reg => {
            const estudiante = reg.estudiante;
            const horaEntrada = new Date(reg.entrada.timestamp).toLocaleTimeString('es-MX');
            const horaSalida = reg.salida ? new Date(reg.salida.timestamp).toLocaleTimeString('es-MX') : 'N/A';

            return [
                reg.fecha.toLocaleDateString('es-MX'),
                horaEntrada,
                horaSalida,
                estudiante?.matricula || 'N/A',
                estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Desconocido',
                estudiante?.grupo || 'Sin grupo',
                reg.es_valida === true ? 'Válida' : reg.es_valida === false ? 'Inválida' : 'Pendiente'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `historial_asistencias_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const limpiarFiltros = () => {
        setFiltros({
            grupoId: '',
            matricula: '',
            fechaInicio: '',
            fechaFin: ''
        });
    };

    const registrosFiltrados = filtrarRegistros();

    // Calcular estadísticas
    const totalRegistros = registrosFiltrados.length;
    const conSalida = registrosFiltrados.filter(r => r.salida !== null).length;
    const sinSalida = registrosFiltrados.filter(r => r.salida === null).length;

    return (
        <div className="historial-container">
            <div className="page-title-container">
                <h1 className="page-title">Historial de Asistencias</h1>
            </div>

            {/* Estadísticas */}
            <div className="historial-stats-grid">
                <div className="historial-stat-card stat-total">
                    <div className="stat-header">
                        <span className="stat-label">Total Registros</span>
                        <Clock className="stat-icon" size={24} />
                    </div>
                    <div className="stat-value">{totalRegistros}</div>
                </div>

                <div className="historial-stat-card stat-entradas">
                    <div className="stat-header">
                        <span className="stat-label">Completas</span>
                        <LogIn className="stat-icon" size={24} />
                    </div>
                    <div className="stat-value">{conSalida}</div>
                </div>

                <div className="historial-stat-card stat-salidas">
                    <div className="stat-header">
                        <span className="stat-label">Pendientes</span>
                        <LogOut className="stat-icon" size={24} />
                    </div>
                    <div className="stat-value">{sinSalida}</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="historial-filters-card">
                <div className="filters-header">
                    <Filter size={20} />
                    <h3>Filtros de búsqueda</h3>
                </div>

                <div className="filters-grid">
                    {/* Buscar estudiante */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <Search size={16} />
                            Buscar Estudiante
                        </label>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Matrícula o nombre..."
                            value={filtros.matricula}
                            onChange={(e) => setFiltros({ ...filtros, matricula: e.target.value })}
                        />
                    </div>

                    {/* Filtrar por grupo */}
                    <div className="filter-group">
                        <label className="filter-label">Grupo</label>
                        <select
                            className="filter-select"
                            value={filtros.grupoId}
                            onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })}
                        >
                            <option value="">Todos los grupos</option>
                            {grupos.map(grupo => (
                                <option key={grupo.id} value={grupo.id}>
                                    {grupo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha inicio */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <Calendar size={16} />
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                        />
                    </div>

                    {/* Fecha fin */}
                    <div className="filter-group">
                        <label className="filter-label">
                            <Calendar size={16} />
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                        />
                    </div>
                </div>

                <div className="filters-actions">
                    <button className="btn-filter-clear" onClick={limpiarFiltros}>
                        Limpiar Filtros
                    </button>
                    <button className="btn-export" onClick={exportarCSV}>
                        <Download size={18} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Tabla de registros */}
            <div className="historial-table-card">
                <div className="table-header">
                    <h3 className="table-title">
                        <Clock size={20} />
                        Historial de Asistencias
                    </h3>
                    <span className="table-count">{registrosFiltrados.length} registros</span>
                </div>

                {loading ? (
                    <div className="table-loading">
                        <div className="spinner"></div>
                        <p>Cargando registros...</p>
                    </div>
                ) : registrosFiltrados.length === 0 ? (
                    <div className="empty-state">
                        <Calendar className="empty-state-icon" size={64} />
                        <p className="empty-state-title">No se encontraron registros</p>
                        <p className="empty-state-text">
                            Intenta ajustar los filtros de búsqueda
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="historial-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora Entrada</th>
                                    <th>Hora Salida</th>
                                    <th>Matrícula</th>
                                    <th>Nombre</th>
                                    <th>Grupo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrosFiltrados.map((registro) => {
                                    const estudiante = registro.estudiante;
                                    const horaEntrada = new Date(registro.entrada.timestamp);
                                    const horaSalida = registro.salida ? new Date(registro.salida.timestamp) : null;

                                    return (
                                        <tr key={registro.id} className={registro.salida ? 'registro-completo' : 'registro-pendiente'}>
                                            <td data-label="Fecha">{registro.fecha.toLocaleDateString('es-MX')}</td>
                                            <td data-label="Hora Entrada">
                                                <span className="hora-badge entrada">
                                                    <LogIn size={14} />
                                                    {horaEntrada.toLocaleTimeString('es-MX')}
                                                </span>
                                            </td>
                                            <td data-label="Hora Salida">
                                                {horaSalida ? (
                                                    <span className="hora-badge salida">
                                                        <LogOut size={14} />
                                                        {horaSalida.toLocaleTimeString('es-MX')}
                                                    </span>
                                                ) : (
                                                    <span className="hora-badge pendiente">—</span>
                                                )}
                                            </td>
                                            <td data-label="Matrícula">{estudiante?.matricula || 'N/A'}</td>
                                            <td data-label="Nombre">
                                                {estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Desconocido'}
                                            </td>
                                            <td data-label="Grupo">{estudiante?.grupo || 'Sin grupo'}</td>
                                            <td data-label="Estado">
                                                <span className={`badge badge-${
                                                    registro.es_valida === true ? 'valida' : 
                                                    registro.es_valida === false ? 'invalida' : 
                                                    'pendiente'
                                                }`}>
                                                    {registro.es_valida === true ? 'Válida' : 
                                                     registro.es_valida === false ? 'Inválida' : 
                                                     'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialAsistenciasPage;
