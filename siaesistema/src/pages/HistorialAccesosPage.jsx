// src/pages/HistorialAccesosPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, Filter, User, Clock } from 'lucide-react';
import { accesosService, ciclosService, estudiantesService, gruposService } from '../api/services';

const HistorialAccesosPage = () => {
    const [accesos, setAccesos] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        cicloId: null,
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
            
            // Cargar ciclo activo
            const cicloActivo = await ciclosService.getActivo();
            setFiltros(prev => ({ ...prev, cicloId: cicloActivo.id }));
            
            // Cargar accesos del ciclo activo
            const accesosData = await accesosService.getByCiclo(cicloActivo.id);
            setAccesos(accesosData);
            
            // Cargar estudiantes y grupos
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

        // Filtrar por matrícula
        if (filtros.matricula) {
            const estudiantesFiltrados = estudiantes
                .filter(est => est.nfc?.nfc_uid)
                .filter(est => est.matricula.includes(filtros.matricula) || 
                              `${est.nombre} ${est.apellido}`.toLowerCase().includes(filtros.matricula.toLowerCase()));
            
            const nfcUids = estudiantesFiltrados.map(est => est.nfc.nfc_uid);
            accesosFiltrados = accesosFiltrados.filter(acc => nfcUids.includes(acc.nfc_uid));
        }

        // Filtrar por grupo
        if (filtros.grupoId) {
            const estudiantesGrupo = estudiantes
                .filter(est => est.id_grupo === parseInt(filtros.grupoId) && est.nfc?.nfc_uid);
            
            const nfcUids = estudiantesGrupo.map(est => est.nfc.nfc_uid);
            accesosFiltrados = accesosFiltrados.filter(acc => nfcUids.includes(acc.nfc_uid));
        }

        // Filtrar por rango de fechas
        if (filtros.fechaInicio) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                const fechaAcceso = new Date(acc.hora_registro).toISOString().split('T')[0];
                return fechaAcceso >= filtros.fechaInicio;
            });
        }

        if (filtros.fechaFin) {
            accesosFiltrados = accesosFiltrados.filter(acc => {
                const fechaAcceso = new Date(acc.hora_registro).toISOString().split('T')[0];
                return fechaAcceso <= filtros.fechaFin;
            });
        }

        return accesosFiltrados;
    };

    const getEstudianteByNFC = (nfcUid) => {
        return estudiantes.find(est => est.nfc?.nfc_uid === nfcUid);
    };

    const exportarCSV = () => {
        const accesosFiltrados = filtrarAccesos();
        
        const headers = ['Fecha', 'Hora', 'Matrícula', 'Nombre', 'Grupo', 'NFC UID'];
        const rows = accesosFiltrados.map(acceso => {
            const estudiante = getEstudianteByNFC(acceso.nfc_uid);
            const fecha = new Date(acceso.hora_registro);
            
            return [
                fecha.toLocaleDateString('es-MX'),
                fecha.toLocaleTimeString('es-MX'),
                estudiante?.matricula || 'N/A',
                estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Desconocido',
                estudiante?.grupo?.nombre || 'Sin grupo',
                acceso.nfc_uid
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `accesos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const limpiarFiltros = () => {
        setFiltros({
            cicloId: filtros.cicloId,
            grupoId: '',
            matricula: '',
            fechaInicio: '',
            fechaFin: ''
        });
    };

    const accesosFiltrados = filtrarAccesos();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Historial de Accesos</h1>
                <button onClick={exportarCSV} className="btn-export">
                    <Download size={20} />
                    Exportar CSV
                </button>
            </div>

            {/* Filtros */}
            <div className="filtros-card">
                <div className="filtros-header">
                    <Filter size={20} />
                    <span>Filtros</span>
                </div>

                <div className="filtros-grid">
                    <div className="form-group">
                        <label>
                            <Search size={16} />
                            Buscar Estudiante
                        </label>
                        <input
                            type="text"
                            placeholder="Matrícula o nombre..."
                            value={filtros.matricula}
                            onChange={(e) => setFiltros({ ...filtros, matricula: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <User size={16} />
                            Grupo
                        </label>
                        <select
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

                    <div className="form-group">
                        <label>
                            <Calendar size={16} />
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Calendar size={16} />
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                        />
                    </div>
                </div>

                <button onClick={limpiarFiltros} className="btn-limpiar">
                    Limpiar Filtros
                </button>
            </div>

            {/* Estadísticas */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{accesosFiltrados.length}</div>
                    <div className="stat-label">Accesos Totales</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">
                        {new Set(accesosFiltrados.map(a => a.nfc_uid)).size}
                    </div>
                    <div className="stat-label">Estudiantes Únicos</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">
                        {new Set(accesosFiltrados.map(a => 
                            new Date(a.hora_registro).toISOString().split('T')[0]
                        )).size}
                    </div>
                    <div className="stat-label">Días Registrados</div>
                </div>
            </div>

            {/* Tabla de Accesos */}
            <div className="table-card">
                {loading ? (
                    <div className="loading-spinner">Cargando accesos...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Matrícula</th>
                                <th>Nombre</th>
                                <th>Grupo</th>
                                <th>NFC UID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accesosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron accesos con los filtros aplicados
                                    </td>
                                </tr>
                            ) : (
                                accesosFiltrados
                                    .sort((a, b) => new Date(b.hora_registro) - new Date(a.hora_registro))
                                    .map((acceso) => {
                                        const estudiante = getEstudianteByNFC(acceso.nfc_uid);
                                        const fecha = new Date(acceso.hora_registro);

                                        return (
                                            <tr key={acceso.id}>
                                                <td>{fecha.toLocaleDateString('es-MX')}</td>
                                                <td>
                                                    <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                    {fecha.toLocaleTimeString('es-MX')}
                                                </td>
                                                <td>{estudiante?.matricula || 'N/A'}</td>
                                                <td>
                                                    {estudiante 
                                                        ? `${estudiante.nombre} ${estudiante.apellido}`
                                                        : 'Desconocido'
                                                    }
                                                </td>
                                                <td>
                                                    {estudiante?.grupo && (
                                                        <span className="badge-grupo">
                                                            {estudiante.grupo.nombre}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <code className="nfc-code">{acceso.nfc_uid}</code>
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
    );
};

export default HistorialAccesosPage;
