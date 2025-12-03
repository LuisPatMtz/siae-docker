// src/pages/HistorialAccesosPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, Filter, User, Clock } from 'lucide-react';
import { asistenciaService, estudiantesService, gruposService } from '../api/services';
import PageContainer from '../components/Common/PageContainer.jsx';
import '../styles/historial-accesos.css';

const HistorialAccesosPage = () => {
    const [accesos, setAccesos] = useState([]);
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

            // Cargar todas las entradas del sistema de asistencias
            // Esto incluye tanto registros por NFC como por matrícula
            const entradasData = await asistenciaService.getTodasEntradas();
            setAccesos(entradasData);

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

    const filtrarAccesos = () => {
        let accesosFiltrados = [...accesos];

        // Filtrar por matrícula o nombre
        if (filtros.matricula) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                const estudiante = acc.estudiante;
                if (!estudiante) return false;

                const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase();
                const busqueda = filtros.matricula.toLowerCase();

                return estudiante.matricula.toLowerCase().includes(busqueda) ||
                    nombreCompleto.includes(busqueda);
            });
        }

        // Filtrar por grupo
        if (filtros.grupoId) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                // El estudiante viene dentro del objeto de asistencia
                const estudiante = acc.estudiante;
                // Necesitamos buscar el estudiante completo para obtener el ID del grupo si no viene en el objeto ligero
                // O comparar con el nombre del grupo si es lo que tenemos
                if (!estudiante) return false;

                // Si tenemos el ID del grupo en el estudiante local (del servicio getAll)
                const estudianteLocal = estudiantes.find(e => e.matricula === estudiante.matricula);
                return estudianteLocal && estudianteLocal.id_grupo === parseInt(filtros.grupoId);
            });
        }

        // Filtrar por rango de fechas
        if (filtros.fechaInicio) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                const fechaAcceso = new Date(acc.timestamp).toISOString().split('T')[0];
                return fechaAcceso >= filtros.fechaInicio;
            });
        }

        if (filtros.fechaFin) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                const fechaAcceso = new Date(acc.timestamp).toISOString().split('T')[0];
                return fechaAcceso <= filtros.fechaFin;
            });
        }

        return accesosFiltrados;
    };

    // Helper para parsear timestamp local (ya que backend envía sin timezone)
    const parseLocalTimestamp = (isoString) => {
        return new Date(isoString);
    };

    const exportarCSV = () => {
        const accesosFiltrados = filtrarAccesos();

        const headers = ['Fecha', 'Hora', 'Matrícula', 'Nombre', 'Grupo'];
        const rows = accesosFiltrados.map(acceso => {
            const estudiante = acceso.estudiante;
            const fecha = parseLocalTimestamp(acceso.timestamp);

            return [
                fecha.toLocaleDateString('es-MX'),
                fecha.toLocaleTimeString('es-MX'),
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
        link.download = `entradas_${new Date().toISOString().split('T')[0]}.csv`;
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

    const accesosFiltrados = filtrarAccesos();

    return (
        <PageContainer>
            <div className="historial-accesos-container">
                <div className="historial-page-header">
                    <h1 className="historial-page-title">Historial de Accesos (Entradas)</h1>
                    <p className="historial-page-subtitle">Todos los registros de entrada (NFC y Matrícula)</p>
                </div>

            {/* Filtros */}
            <div className="historial-filters-card">
                <div className="filters-grid">
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

                    <div className="filter-group">
                        <label className="filter-label">
                            <User size={16} />
                            Grupo
                        </label>
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
                    <button onClick={limpiarFiltros} className="btn-filter-action btn-clear-filters">
                        Limpiar Filtros
                    </button>
                    <button onClick={exportarCSV} className="btn-filter-action btn-export">
                        <Download size={18} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="historial-stats-grid">
                <div className="historial-stat-card stat-total">
                    <div className="stat-value">{accesosFiltrados.length}</div>
                    <div className="stat-label">Entradas Totales</div>
                </div>

                <div className="historial-stat-card stat-entradas">
                    <div className="stat-value">
                        {new Set(accesosFiltrados.map(a => a.estudiante?.matricula)).size}
                    </div>
                    <div className="stat-label">Estudiantes Únicos</div>
                </div>

                <div className="historial-stat-card stat-salidas">
                    <div className="stat-value">
                        {new Set(accesosFiltrados.map(a =>
                            new Date(a.timestamp).toISOString().split('T')[0]
                        )).size}
                    </div>
                    <div className="stat-label">Días Registrados</div>
                </div>
            </div>

            {/* Tabla de Accesos */}
            <div className="historial-table-card">
                <div className="table-container">
                    {loading ? (
                        <div className="loading-spinner">Cargando entradas...</div>
                    ) : (
                        <table className="historial-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Matrícula</th>
                                    <th>Nombre</th>
                                    <th>Grupo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accesosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="empty-state">
                                                <p className="empty-state-title">No se encontraron entradas</p>
                                                <p className="empty-state-text">Intenta ajustar los filtros</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    accesosFiltrados
                                        .map((acceso) => {
                                            const estudiante = acceso.estudiante;
                                            const fecha = parseLocalTimestamp(acceso.timestamp);

                                            return (
                                                <tr key={acceso.id}>
                                                    <td className="td-fecha">{fecha.toLocaleDateString('es-MX')}</td>
                                                    <td className="td-hora">
                                                        <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                        {fecha.toLocaleTimeString('es-MX')}
                                                    </td>
                                                    <td>{estudiante?.matricula || 'N/A'}</td>
                                                    <td className="td-estudiante">
                                                        {estudiante
                                                            ? `${estudiante.nombre} ${estudiante.apellido}`
                                                            : 'Desconocido'
                                                        }
                                                    </td>
                                                    <td className="td-grupo">
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
        </PageContainer>
    );
};

export default HistorialAccesosPage;
