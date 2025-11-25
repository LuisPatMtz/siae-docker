// src/pages/AsistenciasPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, User, Clock, LogIn, LogOut } from 'lucide-react';
import { asistenciaService, estudiantesService, gruposService } from '../api/services';
import '../styles/asistencias.css';

const AsistenciasPage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        matricula: '',
        grupoId: '',
        fechaInicio: '',
        fechaFin: ''
    });

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);

            // Cargar asistencias válidas, estudiantes y grupos
            const [asistenciasData, estudiantesData, gruposData] = await Promise.all([
                asistenciaService.getAsistenciasValidas(),
                estudiantesService.getAll(),
                gruposService.getAll()
            ]);

            setAsistencias(asistenciasData);
            setEstudiantes(estudiantesData);
            setGrupos(gruposData);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarAsistencias = () => {
        let asistenciasFiltradas = [...asistencias];

        // Filtrar por matrícula o nombre
        if (filtros.matricula) {
            asistenciasFiltradas = asistenciasFiltradas.filter(asist => {
                const estudiante = asist.estudiante;
                if (!estudiante) return false;

                const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase();
                const busqueda = filtros.matricula.toLowerCase();

                return estudiante.matricula.includes(busqueda) || nombreCompleto.includes(busqueda);
            });
        }

        // Filtrar por grupo
        if (filtros.grupoId) {
            asistenciasFiltradas = asistenciasFiltradas.filter(asist => {
                const estudiante = estudiantes.find(e => e.matricula === asist.estudiante?.matricula);
                return estudiante && estudiante.id_grupo === parseInt(filtros.grupoId);
            });
        }

        // Filtrar por rango de fechas
        if (filtros.fechaInicio) {
            asistenciasFiltradas = asistenciasFiltradas.filter(asist =>
                asist.fecha >= filtros.fechaInicio
            );
        }

        if (filtros.fechaFin) {
            asistenciasFiltradas = asistenciasFiltradas.filter(asist =>
                asist.fecha <= filtros.fechaFin
            );
        }

        return asistenciasFiltradas;
    };

    const exportarCSV = () => {
        const asistenciasFiltradas = filtrarAsistencias();

        const headers = ['Fecha', 'Hora Entrada', 'Hora Salida', 'Tiempo Permanencia', 'Matrícula', 'Nombre', 'Grupo'];
        const rows = asistenciasFiltradas.map(asist => {
            const estudiante = asist.estudiante;
            return [
                asist.fecha,
                asist.hora_entrada || 'N/A',
                asist.hora_salida || 'N/A',
                asist.tiempo_permanencia || 'N/A',
                estudiante?.matricula || 'N/A',
                estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Desconocido',
                estudiante?.grupo || 'Sin grupo'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `asistencias_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const limpiarFiltros = () => {
        setFiltros({
            matricula: '',
            grupoId: '',
            fechaInicio: '',
            fechaFin: ''
        });
    };

    const asistenciasFiltradas = filtrarAsistencias();

    // Calcular estadísticas
    const estudiantesUnicos = new Set(asistenciasFiltradas.map(a => a.estudiante?.matricula)).size;
    const diasRegistrados = new Set(asistenciasFiltradas.map(a => a.fecha)).size;

    return (
        <div className="asistencias-container">
            <div className="asistencias-page-header">
                <h1 className="asistencias-page-title">Asistencias Completas (Entrada + Salida)</h1>
                <p className="asistencias-page-subtitle">Solo asistencias validadas con entrada y salida (1-8 horas)</p>
            </div>

            {/* Filtros */}
            <div className="asistencias-filters-card">
                <div className="asistencias-filters-grid">
                    <div className="asistencias-filter-group">
                        <label className="asistencias-filter-label">
                            <Search size={16} />
                            Buscar Estudiante
                        </label>
                        <input
                            type="text"
                            className="asistencias-filter-input"
                            placeholder="Matrícula o nombre..."
                            value={filtros.matricula}
                            onChange={(e) => setFiltros({ ...filtros, matricula: e.target.value })}
                        />
                    </div>

                    <div className="asistencias-filter-group">
                        <label className="asistencias-filter-label">
                            <User size={16} />
                            Grupo
                        </label>
                        <select
                            className="asistencias-filter-select"
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

                    <div className="asistencias-filter-group">
                        <label className="asistencias-filter-label">
                            <Calendar size={16} />
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            className="asistencias-filter-input"
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                        />
                    </div>

                    <div className="asistencias-filter-group">
                        <label className="asistencias-filter-label">
                            <Calendar size={16} />
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            className="asistencias-filter-input"
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                        />
                    </div>
                </div>

                <div className="asistencias-filters-actions">
                    <button onClick={limpiarFiltros} className="asistencias-btn-action asistencias-btn-clear">
                        Limpiar Filtros
                    </button>
                    <button onClick={exportarCSV} className="asistencias-btn-action asistencias-btn-export">
                        <Download size={18} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="asistencias-stats-grid">
                <div className="asistencias-stat-card stat-total">
                    <div className="asistencias-stat-value">{asistenciasFiltradas.length}</div>
                    <div className="asistencias-stat-label">Asistencias Válidas</div>
                </div>

                <div className="asistencias-stat-card stat-estudiantes">
                    <div className="asistencias-stat-value">{estudiantesUnicos}</div>
                    <div className="asistencias-stat-label">Estudiantes Únicos</div>
                </div>

                <div className="asistencias-stat-card stat-dias">
                    <div className="asistencias-stat-value">{diasRegistrados}</div>
                    <div className="asistencias-stat-label">Días Registrados</div>
                </div>
            </div>

            {/* Tabla de Asistencias */}
            <div className="asistencias-table-card">
                <div className="asistencias-table-container">
                    {loading ? (
                        <div className="asistencias-loading">Cargando asistencias...</div>
                    ) : (
                        <table className="asistencias-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora Entrada</th>
                                    <th>Hora Salida</th>
                                    <th>Tiempo Permanencia</th>
                                    <th>Matrícula</th>
                                    <th>Nombre</th>
                                    <th>Grupo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asistenciasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="asistencias-empty-state">
                                                <p className="asistencias-empty-state-title">No se encontraron asistencias</p>
                                                <p className="asistencias-empty-state-text">Intenta ajustar los filtros</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    asistenciasFiltradas.map((asist) => {
                                        const estudiante = asist.estudiante;

                                        return (
                                            <tr key={asist.id}>
                                                <td className="asistencias-td-fecha" data-label="Fecha">
                                                    {new Date(asist.fecha).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="asistencias-td-hora" data-label="Hora Entrada">
                                                    <LogIn size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                    {asist.hora_entrada || 'N/A'}
                                                </td>
                                                <td className="asistencias-td-hora" data-label="Hora Salida">
                                                    <LogOut size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                    {asist.hora_salida || 'N/A'}
                                                </td>
                                                <td className="asistencias-td-permanencia" data-label="Tiempo">
                                                    <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                    {asist.tiempo_permanencia || 'N/A'}
                                                </td>
                                                <td data-label="Matrícula">
                                                    {estudiante?.matricula || 'N/A'}
                                                </td>
                                                <td className="asistencias-td-estudiante" data-label="Nombre">
                                                    {estudiante
                                                        ? `${estudiante.nombre} ${estudiante.apellido}`
                                                        : 'Desconocido'
                                                    }
                                                </td>
                                                <td className="asistencias-td-grupo" data-label="Grupo">
                                                    {estudiante?.grupo || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AsistenciasPage;
