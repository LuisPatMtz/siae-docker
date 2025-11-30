import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, HardDrive, Trash2, RotateCcw, FileText, BarChart3, AlertCircle, X, TrendingUp, Package, Filter, Search, Clock, Globe } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { maintenanceService } from '../api/services';
import { useToast } from '../contexts/ToastContext.jsx';
import ConfirmModal from '../components/Common/ConfirmModal.jsx';

const MaintenancePage = () => {
    const [backups, setBackups] = useState([]);
    const [stats, setStats] = useState(null);
    const [tableStats, setTableStats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [showTimezoneModal, setShowTimezoneModal] = useState(false);
    const [cleanupDays, setCleanupDays] = useState(30);
    
    // Estado para reloj
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Estados para timezone
    const [timezoneInfo, setTimezoneInfo] = useState(null);
    const [availableTimezones, setAvailableTimezones] = useState([]);
    const [selectedTimezone, setSelectedTimezone] = useState('');
    
    // Estados para logs
    const [logFiles, setLogFiles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [logFilters, setLogFilters] = useState({
        filename: '',
        level: '',
        logger_name: '',
        limit: 100,
        search: ''
    });
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    
    const { showSuccess, showError } = useToast();

    const fetchBackups = async () => {
        setIsLoading(true);
        try {
            const data = await maintenanceService.getBackups();
            setBackups(data);
        } catch (error) {
            console.error("Error fetching backups:", error);
            showError("Error al cargar los respaldos");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await maintenanceService.getDatabaseStats();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchTableStats = async () => {
        try {
            const data = await maintenanceService.getTableStats();
            setTableStats(data);
        } catch (error) {
            console.error("Error fetching table stats:", error);
        }
    };

    useEffect(() => {
        fetchBackups();
        fetchStats();
    }, []);

    // Actualizar reloj cada segundo
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatFullDate = (date) => {
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            await maintenanceService.createBackup();
            showSuccess("Respaldo creado exitosamente");
            fetchBackups();
            fetchStats();
        } catch (error) {
            console.error("Error creating backup:", error);
            showError(error.response?.data?.detail || "Error al crear el respaldo");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const blob = await maintenanceService.downloadBackup(filename);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess("Respaldo descargado exitosamente");
        } catch (error) {
            console.error("Error downloading backup:", error);
            showError("Error al descargar el respaldo");
        }
    };

    const handleDelete = async () => {
        try {
            await maintenanceService.deleteBackup(selectedBackup);
            showSuccess("Respaldo eliminado exitosamente");
            setShowDeleteModal(false);
            setSelectedBackup(null);
            fetchBackups();
            fetchStats();
        } catch (error) {
            console.error("Error deleting backup:", error);
            showError("Error al eliminar el respaldo");
        }
    };

    const handleRestore = async () => {
        try {
            await maintenanceService.restoreBackup(selectedBackup);
            showSuccess("Base de datos restaurada exitosamente. Se recomienda recargar la página.");
            setShowRestoreModal(false);
            setSelectedBackup(null);
        } catch (error) {
            console.error("Error restoring backup:", error);
            showError(error.response?.data?.detail || "Error al restaurar el respaldo");
        }
    };

    const handleCleanupLogs = async () => {
        try {
            const result = await maintenanceService.cleanupLogs(cleanupDays);
            showSuccess(`${result.message}. Espacio liberado: ${formatSize(result.freed_space)}`);
            setShowCleanupModal(false);
            // Recargar archivos de log si el modal de logs está abierto
            if (showLogsModal) {
                fetchLogFiles();
                fetchLogs();
            }
        } catch (error) {
            console.error("Error cleaning up logs:", error);
            showError("Error al limpiar los logs");
        }
    };

    const handleShowStats = async () => {
        setShowStatsModal(true);
        await fetchTableStats();
    };

    const handleShowLogs = async () => {
        setShowLogsModal(true);
        await fetchLogFiles();
        await fetchLogs();
    };

    const handleShowTimezone = async () => {
        try {
            const [info, timezones] = await Promise.all([
                maintenanceService.getTimezoneInfo(),
                maintenanceService.getAvailableTimezones()
            ]);
            setTimezoneInfo(info);
            setAvailableTimezones(timezones);
            setSelectedTimezone(info.timezone);
            setShowTimezoneModal(true);
        } catch (error) {
            console.error("Error fetching timezone info:", error);
            showError("Error al cargar información de zona horaria");
        }
    };

    const handleUpdateTimezone = async () => {
        try {
            const info = await maintenanceService.updateTimezone(selectedTimezone);
            setTimezoneInfo(info);
            showSuccess(`Zona horaria actualizada a: ${info.timezone}`);
            setShowTimezoneModal(false);
            // Recargar datos para reflejar nueva hora
            fetchBackups();
            fetchStats();
        } catch (error) {
            console.error("Error updating timezone:", error);
            showError(error.response?.data?.detail || "Error al actualizar zona horaria");
        }
    };

    const fetchLogFiles = async () => {
        try {
            const data = await maintenanceService.getLogFiles();
            setLogFiles(data);
        } catch (error) {
            console.error("Error fetching log files:", error);
            showError("Error al cargar los archivos de log");
        }
    };

    const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const data = await maintenanceService.getLogs(logFilters);
            setLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
            showError("Error al cargar los logs");
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setLogFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchLogs();
    };

    const getLevelColor = (level) => {
        const colors = {
            DEBUG: '#6b7280',
            INFO: '#3b82f6',
            WARNING: '#f59e0b',
            ERROR: '#ef4444',
            CRITICAL: '#991b1b'
        };
        return colors[level] || '#6b7280';
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="dashboard-main">
            <div className="page-title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Mantenimiento y Respaldos</h1>
                
                {/* Reloj del sistema */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    color: 'white',
                    minWidth: '280px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Clock size={20} />
                        <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Hora del Sistema</span>
                    </div>
                    <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: '700',
                        fontFamily: '"Courier New", monospace',
                        letterSpacing: '2px'
                    }}>
                        {formatTime(currentTime)}
                    </div>
                    <div style={{ 
                        fontSize: '0.875rem', 
                        opacity: 0.9,
                        textTransform: 'capitalize',
                        marginTop: '4px'
                    }}>
                        {formatFullDate(currentTime)}
                    </div>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            {stats && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px', 
                    marginBottom: '24px' 
                }}>
                    <div className="stat-card">
                        <div className="stat-value">{stats.total_students}</div>
                        <div className="stat-label">Estudiantes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.total_users}</div>
                        <div className="stat-label">Usuarios</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.total_attendances}</div>
                        <div className="stat-label">Asistencias</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.total_absences}</div>
                        <div className="stat-label">Faltas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.database_size}</div>
                        <div className="stat-label">Tamaño BD</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.backup_count}</div>
                        <div className="stat-label">Respaldos</div>
                    </div>
                </div>
            )}

            <div className="users-toolbar">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="users-btn users-btn-secondary" onClick={handleShowStats}>
                        <BarChart3 size={18} />
                        Ver Estadísticas
                    </button>
                    <button className="users-btn users-btn-secondary" onClick={handleShowLogs}>
                        <FileText size={18} />
                        Ver Logs
                    </button>
                    <button className="users-btn users-btn-secondary" onClick={handleShowTimezone}>
                        <Globe size={18} />
                        Zona Horaria
                    </button>
                </div>
                <button
                    className="users-btn users-btn-primary"
                    onClick={handleCreateBackup}
                    disabled={isCreating}
                >
                    {isCreating ? <RefreshCw className="animate-spin" size={18} /> : <Database size={18} />}
                    {isCreating ? 'Creando...' : 'Crear Nuevo Respaldo'}
                </button>
            </div>

            <div className="users-grid-container" style={{ display: 'block' }}>
                <div className="card">
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#1f2937'
                    }}>
                        <HardDrive size={24} style={{ color: '#3b82f6' }} />
                        Respaldos Disponibles
                    </h2>

                    {isLoading ? (
                        <div className="loading-message">Cargando respaldos...</div>
                    ) : backups.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: '0.875rem' }}>
                                        <th style={{ padding: '0 16px 8px' }}>Nombre del Archivo</th>
                                        <th style={{ padding: '0 16px 8px' }}>Fecha de Creación</th>
                                        <th style={{ padding: '0 16px 8px' }}>Tamaño</th>
                                        <th style={{ padding: '0 16px 8px', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.map((backup) => (
                                        <tr key={backup.filename} style={{
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', fontWeight: '500', color: '#374151' }}>
                                                {backup.filename}
                                            </td>
                                            <td style={{ padding: '16px', color: '#6b7280' }}>
                                                {formatDate(backup.created)}
                                            </td>
                                            <td style={{ padding: '16px', color: '#6b7280' }}>
                                                {formatSize(backup.size)}
                                            </td>
                                            <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleDownload(backup.filename)}
                                                        className="users-btn users-btn-secondary"
                                                        style={{ padding: '8px', borderRadius: '8px', minWidth: 'auto' }}
                                                        title="Descargar"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup.filename);
                                                            setShowRestoreModal(true);
                                                        }}
                                                        className="users-btn users-btn-secondary"
                                                        style={{ padding: '8px', borderRadius: '8px', minWidth: 'auto' }}
                                                        title="Restaurar"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup.filename);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="users-btn"
                                                        style={{ 
                                                            padding: '8px', 
                                                            borderRadius: '8px', 
                                                            minWidth: 'auto',
                                                            background: '#ef4444',
                                                            color: 'white'
                                                        }}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                            <HardDrive size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <p>No hay respaldos disponibles.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Confirmar Eliminación"
                icon={Trash2}
                isDanger={true}
                message={`¿Estás seguro de que deseas eliminar el respaldo "${selectedBackup}"?`}
                
                warningMessage="Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />

            {/* Modal de confirmación para restaurar */}
            <ConfirmModal
                isOpen={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                onConfirm={handleRestore}
                title="Confirmar Restauración"
                icon={AlertCircle}
                confirmText="Restaurar"
            >
                <p>
                    ¿Estás seguro de que deseas restaurar la base de datos desde <strong className="user-highlight">"{selectedBackup}"</strong>?
                </p>
                <div className="warning-box">
                    <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                    <div className="warning-box-content">
                        <p className="warning-box-title">
                            ⚠️ ADVERTENCIA
                        </p>
                        <p className="warning-box-text">
                            Esto sobrescribirá todos los datos actuales de la base de datos.
                        </p>
                    </div>
                </div>
                <p className="info-note">
                    💡 Se recomienda crear un respaldo de la base de datos actual antes de continuar.
                </p>
            </ConfirmModal>

            {/* Modal para limpiar logs */}
            <ConfirmModal
                isOpen={showCleanupModal}
                onClose={() => setShowCleanupModal(false)}
                onConfirm={handleCleanupLogs}
                title="Limpiar Logs Antiguos"
                icon={FileText}
                confirmText="Limpiar"
            >
                <p style={{ marginBottom: '16px' }}>Eliminar archivos de log con más de:</p>
                <div className="form-group">
                    <label className="form-label">Días de antigüedad:</label>
                    <input 
                        type="number" 
                        min="1" 
                        value={cleanupDays}
                        onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                        className="form-input"
                    />
                </div>
            </ConfirmModal>

            {/* Modal de estadísticas */}
            {showStatsModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '1100px', maxHeight: '90vh' }}>
                        <div className="modal-header form-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart3 size={20} /> Estadísticas de Base de Datos
                            </h2>
                            <button onClick={() => setShowStatsModal(false)} className="close-form-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {tableStats.length > 0 ? (
                                <>
                                    {/* Cards de métricas */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                        gap: '16px', 
                                        marginBottom: '32px' 
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <Package size={24} />
                                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Tablas</span>
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                                                {tableStats.length}
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <Database size={24} />
                                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Registros</span>
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                                                {tableStats.reduce((sum, t) => sum + t.row_count, 0).toLocaleString('es-MX')}
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <TrendingUp size={24} />
                                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tabla Mayor</span>
                                            </div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                                {tableStats[0]?.table_name.split('.')[1] || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '4px' }}>
                                                {tableStats[0]?.total_size}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gráficas */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                        {/* Gráfica de Barras - Top 10 Tablas por Tamaño */}
                                        <div style={{ 
                                            background: 'white', 
                                            borderRadius: '12px', 
                                            padding: '20px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <h3 style={{ 
                                                fontSize: '1rem', 
                                                fontWeight: '600', 
                                                marginBottom: '16px',
                                                color: '#1f2937'
                                            }}>
                                                Top 10 Tablas por Tamaño
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={tableStats.slice(0, 10).map(t => ({
                                                    name: t.table_name.split('.')[1] || t.table_name,
                                                    size: parseInt(t.total_size.replace(/[^\d]/g, '')) || 0
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        angle={-45} 
                                                        textAnchor="end" 
                                                        height={80}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            borderRadius: '8px', 
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                    <Bar dataKey="size" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Gráfica de Pastel - Distribución de Registros */}
                                        <div style={{ 
                                            background: 'white', 
                                            borderRadius: '12px', 
                                            padding: '20px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <h3 style={{ 
                                                fontSize: '1rem', 
                                                fontWeight: '600', 
                                                marginBottom: '16px',
                                                color: '#1f2937'
                                            }}>
                                                Distribución de Registros (Top 8)
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={tableStats.slice(0, 8).map(t => ({
                                                            name: t.table_name.split('.')[1] || t.table_name,
                                                            value: t.row_count
                                                        }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {tableStats.slice(0, 8).map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={[
                                                                    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
                                                                    '#10b981', '#06b6d4', '#6366f1', '#a855f7'
                                                                ][index % 8]} 
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            borderRadius: '8px', 
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Tabla detallada */}
                                    <div style={{ 
                                        background: 'white', 
                                        borderRadius: '12px', 
                                        border: '1px solid #e5e7eb',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ 
                                            padding: '16px 24px', 
                                            borderBottom: '1px solid #e5e7eb',
                                            background: '#f9fafb'
                                        }}>
                                            <h3 style={{ 
                                                fontSize: '1rem', 
                                                fontWeight: '600',
                                                color: '#1f2937',
                                                margin: 0
                                            }}>
                                                Detalle de Todas las Tablas
                                            </h3>
                                        </div>
                                        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                                            <table style={{ 
                                                width: '100%', 
                                                borderCollapse: 'collapse',
                                                fontSize: '0.9rem'
                                            }}>
                                                <thead style={{ 
                                                    position: 'sticky', 
                                                    top: 0, 
                                                    background: '#f9fafb',
                                                    zIndex: 1
                                                }}>
                                                    <tr>
                                                        <th style={{ 
                                                            padding: '12px 24px', 
                                                            textAlign: 'left',
                                                            fontWeight: '600',
                                                            color: '#6b7280',
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            borderBottom: '1px solid #e5e7eb'
                                                        }}>
                                                            Tabla
                                                        </th>
                                                        <th style={{ 
                                                            padding: '12px 24px', 
                                                            textAlign: 'right',
                                                            fontWeight: '600',
                                                            color: '#6b7280',
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            borderBottom: '1px solid #e5e7eb'
                                                        }}>
                                                            Registros
                                                        </th>
                                                        <th style={{ 
                                                            padding: '12px 24px', 
                                                            textAlign: 'right',
                                                            fontWeight: '600',
                                                            color: '#6b7280',
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            borderBottom: '1px solid #e5e7eb'
                                                        }}>
                                                            Tamaño
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableStats.map((table, idx) => (
                                                        <tr key={idx} style={{ 
                                                            borderBottom: '1px solid #f3f4f6',
                                                            transition: 'background 0.15s'
                                                        }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <td style={{ 
                                                                padding: '12px 24px', 
                                                                fontFamily: 'ui-monospace, monospace',
                                                                color: '#1f2937',
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                {table.table_name}
                                                            </td>
                                                            <td style={{ 
                                                                padding: '12px 24px', 
                                                                textAlign: 'right',
                                                                color: '#6b7280',
                                                                fontWeight: '500'
                                                            }}>
                                                                {table.row_count.toLocaleString('es-MX')}
                                                            </td>
                                                            <td style={{ 
                                                                padding: '12px 24px', 
                                                                textAlign: 'right',
                                                                color: '#3b82f6',
                                                                fontWeight: '600'
                                                            }}>
                                                                {table.total_size}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 24px', 
                                    color: '#6b7280' 
                                }}>
                                    <RefreshCw 
                                        size={40} 
                                        className="animate-spin" 
                                        style={{ 
                                            margin: '0 auto 20px', 
                                            opacity: 0.4,
                                            display: 'block'
                                        }} 
                                    />
                                    <p style={{ 
                                        fontSize: '1rem', 
                                        fontWeight: '500',
                                        margin: 0 
                                    }}>
                                        Cargando estadísticas...
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions form-actions">
                            <button 
                                type="button" 
                                className="modal-btn cancel" 
                                onClick={() => setShowStatsModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Logs */}
            {showLogsModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '1400px', maxHeight: '90vh' }}>
                        <div className="modal-header form-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} /> Visor de Logs del Sistema
                            </h2>
                            <button onClick={() => setShowLogsModal(false)} className="close-form-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                            {/* Filtros */}
                            <div style={{ 
                                background: '#f9fafb', 
                                borderRadius: '12px', 
                                padding: '20px', 
                                marginBottom: '24px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    marginBottom: '16px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <Filter size={18} />
                                    <span>Filtros</span>
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                    gap: '12px',
                                    marginBottom: '16px'
                                }}>
                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                            Archivo
                                        </label>
                                        <select 
                                            value={logFilters.filename}
                                            onChange={(e) => handleFilterChange('filename', e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <option value="">Más reciente</option>
                                            {logFiles.map(file => (
                                                <option key={file.filename} value={file.filename}>
                                                    {file.filename} ({formatSize(file.size)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                            Nivel
                                        </label>
                                        <select 
                                            value={logFilters.level}
                                            onChange={(e) => handleFilterChange('level', e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <option value="">Todos</option>
                                            <option value="DEBUG">DEBUG</option>
                                            <option value="INFO">INFO</option>
                                            <option value="WARNING">WARNING</option>
                                            <option value="ERROR">ERROR</option>
                                            <option value="CRITICAL">CRITICAL</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                            Logger
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ej: siae.api"
                                            value={logFilters.logger_name}
                                            onChange={(e) => handleFilterChange('logger_name', e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                            Límite
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="1000"
                                            value={logFilters.limit}
                                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                        Buscar en mensaje
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Buscar texto en logs..."
                                        value={logFilters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px 12px 8px 36px', 
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.875rem',
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: '10px center'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="users-btn users-btn-primary"
                                        style={{ padding: '8px 16px' }}
                                    >
                                        <Search size={16} />
                                        Aplicar Filtros
                                    </button>
                                    <button
                                        onClick={() => setShowCleanupModal(true)}
                                        className="users-btn"
                                        style={{ 
                                            padding: '8px 16px',
                                            background: '#ef4444',
                                            color: 'white'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Limpiar Logs Antiguos
                                    </button>
                                </div>
                            </div>

                            {/* Información de logs */}
                            {logs.total_lines !== undefined && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '16px', 
                                    marginBottom: '16px',
                                    fontSize: '0.875rem',
                                    color: '#6b7280'
                                }}>
                                    <span>Total de líneas: <strong>{logs.total_lines}</strong></span>
                                    <span>Filtradas: <strong>{logs.filtered_lines}</strong></span>
                                </div>
                            )}

                            {/* Logs */}
                            <div style={{ 
                                background: '#1e1e1e', 
                                borderRadius: '12px', 
                                border: '1px solid #333',
                                overflow: 'hidden'
                            }}>
                                {isLoadingLogs ? (
                                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                                        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                        <p>Cargando logs...</p>
                                    </div>
                                ) : logs.entries && logs.entries.length > 0 ? (
                                    <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                                        {/* Header fijo */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '160px 90px 180px 1fr',
                                            gap: '16px',
                                            padding: '12px 16px',
                                            background: '#2d2d2d',
                                            borderBottom: '2px solid #444',
                                            fontWeight: '600',
                                            fontSize: '0.75rem',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 1
                                        }}>
                                            <span>Timestamp</span>
                                            <span>Nivel</span>
                                            <span>Logger</span>
                                            <span>Mensaje</span>
                                        </div>

                                        {/* Logs */}
                                        {logs.entries.map((log, idx) => (
                                            <div 
                                                key={idx}
                                                style={{ 
                                                    display: 'grid',
                                                    gridTemplateColumns: '160px 90px 180px 1fr',
                                                    gap: '16px',
                                                    padding: '10px 16px',
                                                    borderBottom: idx < logs.entries.length - 1 ? '1px solid #333' : 'none',
                                                    fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
                                                    fontSize: '0.8125rem',
                                                    alignItems: 'center',
                                                    transition: 'all 0.15s ease',
                                                    cursor: 'default'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#252525';
                                                    e.currentTarget.style.borderLeft = '3px solid ' + getLevelColor(log.level);
                                                    e.currentTarget.style.paddingLeft = '13px';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.borderLeft = 'none';
                                                    e.currentTarget.style.paddingLeft = '16px';
                                                }}
                                            >
                                                {/* Timestamp */}
                                                <span style={{ 
                                                    color: '#6b7280', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {log.timestamp.split(' ')[1]}
                                                </span>

                                                {/* Nivel con badge */}
                                                <span style={{ 
                                                    fontWeight: '700',
                                                    color: '#fff',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    background: getLevelColor(log.level),
                                                    fontSize: '0.7rem',
                                                    textAlign: 'center',
                                                    display: 'inline-block',
                                                    letterSpacing: '0.5px',
                                                    boxShadow: `0 2px 8px ${getLevelColor(log.level)}40`,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {log.level}
                                                </span>

                                                {/* Logger */}
                                                <span style={{ 
                                                    color: '#60a5fa', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }} title={log.logger}>
                                                    {log.logger}
                                                </span>

                                                {/* Mensaje */}
                                                <span style={{ 
                                                    color: '#d1d5db',
                                                    lineHeight: '1.5',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {log.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                                        <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p>No se encontraron logs con los filtros aplicados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions form-actions">
                            <button 
                                type="button" 
                                className="modal-btn cancel" 
                                onClick={() => setShowLogsModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Configuración de Zona Horaria */}
            {showTimezoneModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '600px' }}>
                        <div className="modal-header form-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Globe size={20} /> Configuración de Zona Horaria
                            </h2>
                            <button onClick={() => setShowTimezoneModal(false)} className="close-form-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '24px' }}>
                            {timezoneInfo && (
                                <>
                                    {/* Información actual */}
                                    <div style={{
                                        background: '#f9fafb',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        marginBottom: '24px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                                            Configuración Actual
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Zona Horaria</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>{timezoneInfo.timezone}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Offset UTC</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                                                    {timezoneInfo.offset} ({timezoneInfo.abbreviation})
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Hora Actual</div>
                                                <div style={{ 
                                                    fontSize: '1.25rem', 
                                                    fontWeight: '700', 
                                                    color: '#3b82f6',
                                                    fontFamily: '"Courier New", monospace'
                                                }}>
                                                    {new Date(timezoneInfo.current_time).toLocaleString('es-MX')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selector de zona horaria */}
                                    <div className="modal-input-group">
                                        <label htmlFor="timezone">Seleccionar Nueva Zona Horaria</label>
                                        <select
                                            id="timezone"
                                            value={selectedTimezone}
                                            onChange={(e) => setSelectedTimezone(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {availableTimezones.map(tz => (
                                                <option key={tz} value={tz}>
                                                    {tz} {tz === timezoneInfo.timezone && '(Actual)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Nota informativa */}
                                    <div style={{
                                        background: '#dbeafe',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginTop: '16px',
                                        fontSize: '0.875rem',
                                        color: '#1e40af'
                                    }}>
                                        <strong>Nota:</strong> Esta configuración afectará todas las fechas y horas mostradas en el sistema, 
                                        incluyendo backups, logs, registros de asistencia y reportes. Los cambios se aplicarán inmediatamente.
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-actions form-actions">
                            <button 
                                type="button" 
                                className="modal-btn cancel" 
                                onClick={() => setShowTimezoneModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                className="modal-btn confirm" 
                                onClick={handleUpdateTimezone}
                                disabled={!selectedTimezone || selectedTimezone === timezoneInfo?.timezone}
                                style={{
                                    opacity: (!selectedTimezone || selectedTimezone === timezoneInfo?.timezone) ? 0.5 : 1,
                                    cursor: (!selectedTimezone || selectedTimezone === timezoneInfo?.timezone) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Aplicar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MaintenancePage;
