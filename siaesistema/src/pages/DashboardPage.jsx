import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import StatsCard from '../components/Dashboard/StatsCard.jsx';
import AttendanceBarChart from '../components/Dashboard/AttendanceBarChart.jsx';
import Modal from '../components/UI/Modal.jsx';
import StudentGroupsNav from '../components/Dashboard/StudentGroupsNav.jsx';
import GroupAttendanceCard from '../components/Dashboard/GroupAttendanceCard.jsx';
import PeriodStatsCard from '../components/Dashboard/PeriodStatsCard.jsx';
import AttendanceMetricsChart from '../components/Dashboard/AttendanceMetricsChart.jsx';
import PageContainer from '../components/Common/PageContainer.jsx';
import SetupWizard from '../components/SetupWizard/SetupWizard.jsx';

const DashboardPage = () => {
  // Estados para detectar configuración del sistema
  const [hasCycle, setHasCycle] = useState(null); // null = cargando, true/false = estado
  const [hasGroups, setHasGroups] = useState(null);
  const [hasStudents, setHasStudents] = useState(null);
  const [isCheckingSystem, setIsCheckingSystem] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(null);
  
  // Estado para filtro de período de barra
  const [barPeriod, setBarPeriod] = useState('week');
  const PERIOD_OPTIONS = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'semester', label: 'Ciclo Escolar' }
  ];
  // Datos reales para la gráfica de barras
  const [attendanceBarData, setAttendanceBarData] = useState([]);

  // Estados para gestión de grupos reales
  const [grupos, setGrupos] = useState([]);
  const [semestersData, setSemestersData] = useState({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupStats, setGroupStats] = useState([]); // Pie chart data

  // Modal para asistencia de grupo
  const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('general');
  const [statsData, setStatsData] = useState({ totalStudents: 0, averageAttendance: 0.0 });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [attendancePeriod, setAttendancePeriod] = useState('semester');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [groupAttendanceData, setGroupAttendanceData] = useState(null);
  const [isTurnLoading, setIsTurnLoading] = useState(true);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [isLoadingPeriodStats, setIsLoadingPeriodStats] = useState(false);
  const [metricsData, setMetricsData] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Cargar datos de asistencia para la gráfica de barras cuando cambie el período o los grupos
  useEffect(() => {
    const fetchBarData = async () => {
      if (!groupStats.length) {
        setAttendanceBarData([]);
        return;
      }
      const promises = groupStats.map(async g => {
        try {
          // periodos: day, week, month, semester
          const res = await apiClient.get(`/api/dashboard/grupo/${g.id}?periodo=${barPeriod}`);
          return { name: g.name, attendance: res.data.attendance[barPeriod] || 0 };
        } catch {
          return { name: g.name, attendance: 0 };
        }
      });
      const data = await Promise.all(promises);
      setAttendanceBarData(data);
    };
    fetchBarData();
  }, [barPeriod, groupStats]);

  // Estado para estadísticas por períodos
  const [periodStatsData, setPeriodStatsData] = useState(null);

  // Función para cargar grupos desde la API y sus integrantes
  const fetchGroupsAndStats = async () => {
    setIsLoadingGroups(true);
    try {
      // 1. Obtener grupos por turno
      const response = await apiClient.get(`/api/dashboard/turno?modo=${activeMode}`);
      const apiData = response.data;
      // 2. Obtener todos los grupos (con id y nombre)
      const gruposResponse = await apiClient.get('/api/grupos');
      const gruposList = gruposResponse.data;
      setGrupos(gruposList);
      // 3. Filtrar grupos por turno activo
      const gruposFiltrados = activeMode === 'general'
        ? gruposList
        : gruposList.filter(grupo => grupo.turno?.toLowerCase() === activeMode.toLowerCase());
      // 4. Organizar por semestre
      let gruposOrganizados = gruposFiltrados.reduce((acc, grupo) => {
        const semestreKey = `${grupo.semestre}er Semestre`;
        if (!acc[semestreKey]) acc[semestreKey] = [];
        acc[semestreKey].push(grupo.nombre || `Grupo ${grupo.id}`);
        return acc;
      }, {});
      setSemestersData(gruposOrganizados);
      // 5. Para cada grupo, obtener el número de integrantes
      const statsPromises = gruposFiltrados.map(async grupo => {
        try {
          const res = await apiClient.get(`/api/dashboard/grupo/${grupo.id}`);
          return { ...grupo, name: grupo.nombre || `Grupo ${grupo.id}`, value: res.data.totalStudents };
        } catch {
          return { ...grupo, name: grupo.nombre || `Grupo ${grupo.id}`, value: 0 };
        }
      });
      const statsRaw = await Promise.all(statsPromises);
      // Filtrar grupos con al menos 1 estudiante
      const stats = statsRaw.filter(g => g.value > 0);
      setGroupStats(stats);
      // Actualizar grupos y semestersData para navegación
      setGrupos(stats); // Solo grupos con estudiantes
      gruposOrganizados = stats.reduce((acc, grupo) => {
        const semestreKey = `${grupo.semestre}er Semestre`;
        if (!acc[semestreKey]) acc[semestreKey] = [];
        acc[semestreKey].push({ id: grupo.id, nombre: grupo.nombre || `Grupo ${grupo.id}` });
        return acc;
      }, {});
      setSemestersData(gruposOrganizados);
    } catch (error) {
      console.error('Error al cargar grupos y stats:', error);
      setGrupos([]);
      setSemestersData({});
      setGroupStats([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Función para cargar estadísticas por períodos
  const fetchPeriodStats = async () => {
    setIsLoadingPeriodStats(true);
    try {
      const turnoParam = activeMode === 'general' ? '' : `turno=${activeMode}`;
      const grupoParam = selectedGroup ? `grupo_id=${selectedGroup}` : '';
      const params = [turnoParam, grupoParam].filter(p => p).join('&');
      const url = `/api/dashboard/estadisticas/periodos${params ? '?' + params : ''}`;

      const response = await apiClient.get(url);
      setPeriodStatsData(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas de períodos:', error);
      setPeriodStatsData(null);
    } finally {
      setIsLoadingPeriodStats(false);
    }
  };

  // Cargar grupos y stats al montar el componente y cuando cambie el modo
  useEffect(() => {
    fetchGroupsAndStats();
  }, [activeMode]);

  // *** VERIFICACIÓN INICIAL: Comprobar estado del sistema ***
  useEffect(() => {
    const checkSystemStatus = async () => {
      setIsCheckingSystem(true);
      try {
        // 1. Verificar si existe ciclo escolar activo
        const cycleResponse = await apiClient.get('/api/ciclos-escolares');
        const hasCycleData = cycleResponse.data && cycleResponse.data.length > 0;
        setHasCycle(hasCycleData);

        if (!hasCycleData) {
          setIsCheckingSystem(false);
          setSetupStep('create-cycle');
          setShowSetupWizard(true);
          return; // No continuar si no hay ciclo
        }

        // 2. Verificar si existen grupos
        const groupsResponse = await apiClient.get('/api/grupos');
        const hasGroupsData = groupsResponse.data && groupsResponse.data.length > 0;
        setHasGroups(hasGroupsData);

        if (!hasGroupsData) {
          setIsCheckingSystem(false);
          setSetupStep('create-groups');
          setShowSetupWizard(true);
          return; // No continuar si no hay grupos
        }

        // 3. Verificar si existen estudiantes
        const studentsResponse = await apiClient.get('/api/estudiantes');
        const hasStudentsData = studentsResponse.data && studentsResponse.data.length > 0;
        setHasStudents(hasStudentsData);

      } catch (error) {
        console.error('Error al verificar estado del sistema:', error);
        // En caso de error, asumir que no hay datos
        setHasCycle(false);
        setHasGroups(false);
        setHasStudents(false);
      } finally {
        setIsCheckingSystem(false);
      }
    };

    checkSystemStatus();
  }, []); // Solo ejecutar al montar

  // Cargar grupos y stats al montar el componente y cuando cambie el modo
  useEffect(() => {
    // Solo cargar datos si el sistema está configurado
    if (hasCycle && hasGroups && hasStudents) {
      fetchGroupsAndStats();
    }
  }, [activeMode, hasCycle, hasGroups, hasStudents]);

  // Cargar estadísticas de períodos cuando cambie el turno o grupo seleccionado
  useEffect(() => {
    // Solo cargar si hay un grupo seleccionado
    if (selectedGroup) {
      fetchPeriodStats();
    } else {
      setPeriodStatsData(null);
    }
  }, [activeMode, selectedGroup]);


  // *** INTERRUPTOR #1: Cargar datos del TURNO (StatsCard) ***
  useEffect(() => {
    setIsTurnLoading(true);
    const fetchTurnData = async () => {
      try {
        const response = await apiClient.get(`/api/dashboard/turno?modo=${activeMode}`);
        const apiData = response.data;
        setStatsData(apiData.stats);
        setSelectedGroup(null);
        setGroupAttendanceData(null);
      } catch (error) {
        console.error("Error al obtener datos del turno:", error);
        setStatsData({ totalStudents: 0, averageAttendance: 0.0 });
      } finally {
        setIsTurnLoading(false);
      }
    };
    fetchTurnData();
  }, [activeMode]);


  // *** INTERRUPTOR #2: Cargar datos de ASISTENCIA POR GRUPO/PERIODO ***
  useEffect(() => {
    if (!selectedGroup) {
      setGroupAttendanceData(null);
      return;
    }

    // Si es custom pero no hay fechas, no hacer el request
    if (attendancePeriod === 'custom' && (!customDateRange.start || !customDateRange.end)) {
      console.log('Periodo custom sin fechas, esperando...');
      return;
    }

    setIsGroupLoading(true);

    const fetchGroupData = async () => {
      try {
        let url = `/api/dashboard/grupo/${selectedGroup}?periodo=${attendancePeriod}`;
        
        // Si el periodo es custom, agregar fechas
        if (attendancePeriod === 'custom' && customDateRange.start && customDateRange.end) {
          url += `&fecha_inicio=${customDateRange.start}&fecha_fin=${customDateRange.end}`;
          console.log('URL de grupo con custom:', url);
        }
        
        const response = await apiClient.get(url);
        const data = response.data;
        setGroupAttendanceData(data);

      } catch (error) {
        console.error("Error al obtener datos de asistencia:", error);
        setGroupAttendanceData(null);
      } finally {
        setIsGroupLoading(false);
      }
    };

    fetchGroupData();

  }, [selectedGroup, attendancePeriod, customDateRange]);

  // *** INTERRUPTOR #3: Cargar datos de MÉTRICAS DIARIAS ***
  useEffect(() => {
    if (!selectedGroup) {
      setMetricsData(null);
      return;
    }

    // Si es custom pero no hay fechas, no hacer el request
    if (attendancePeriod === 'custom' && (!customDateRange.start || !customDateRange.end)) {
      console.log('Periodo custom sin fechas en métricas, esperando...');
      return;
    }

    setIsLoadingMetrics(true);

    const fetchMetricsData = async () => {
      try {
        let url = `/api/dashboard/grupo/${selectedGroup}/grafica-diaria?periodo=${attendancePeriod}`;
        
        // Si el periodo es custom, agregar fechas
        if (attendancePeriod === 'custom' && customDateRange.start && customDateRange.end) {
          url += `&fecha_inicio=${customDateRange.start}&fecha_fin=${customDateRange.end}`;
          console.log('URL de métricas con custom:', url);
        }
        
        console.log('Fetching metrics with periodo:', attendancePeriod, 'dates:', customDateRange);
        const response = await apiClient.get(url);
        setMetricsData(response.data);
      } catch (error) {
        console.error("Error al obtener métricas diarias:", error);
        setMetricsData(null);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetricsData();

  }, [selectedGroup, attendancePeriod, customDateRange]);


  // Manejar cambio de rango personalizado
  const handleCustomDateChange = (startDate, endDate) => {
    console.log('handleCustomDateChange llamado con:', startDate, endDate);
    setCustomDateRange({ start: startDate, end: endDate });
  };

  // Wrapper para el selector de grupo que resetea el período
  const handleSelectGroup = (grupoId) => {
    setSelectedGroup(grupoId);
    // Encontrar el nombre del grupo
    const grupo = grupos.find(g => g.id === grupoId);
    setSelectedGroupName(grupo ? grupo.nombre : grupoId);
    setAttendancePeriod('semester'); // Resetea el filtro a 'Total Semestre'
    setAttendanceModalOpen(true);
  };


  return (
    <PageContainer>
      {/* Modal de configuración del sistema */}
      {showSetupWizard && (
        <SetupWizard
          step={setupStep}
          onComplete={() => {
            setShowSetupWizard(false);
            window.location.reload(); // Recargar para actualizar estado
          }}
          onClose={() => setShowSetupWizard(false)}
        />
      )}

      <main className="dashboard-main">
        <div className="page-title-container">
          <h1 className="page-title">Dashboard</h1>
        </div>

      {/* Mostrar loading mientras verifica el sistema */}
      {isCheckingSystem ? (
        <div className="loading-message">
          Verificando configuración del sistema...
        </div>
      ) : (
        <>
          {/* Mostrar dashboard completo siempre (el modal guía al usuario) */}
          {(isTurnLoading || isLoadingGroups) ? (
            <div className="loading-message">
              {isTurnLoading && isLoadingGroups ? 'Cargando datos del dashboard...' :
                isTurnLoading ? 'Cargando datos del turno...' :
                  'Cargando grupos...'}
            </div>
          ) : (
                <>
          <div className="dashboard-controls-modes-bar dashboard-card-header">
            <DashboardControls
              activeMode={activeMode}
              onModeChange={setActiveMode}
            />
          </div>
          <div className="dashboard-horizontal-layout">
            <div className="dashboard-horizontal-section attendance-bar-section">
              <StatsCard
                title={`Datos de la Sección ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}`}
                totalStudents={statsData.totalStudents}
                averageAttendance={statsData.averageAttendance}
                groupStats={groupStats}
              />
            </div>
            <div className="dashboard-horizontal-section attendance-bar-section">
              <div className="attendance-bar-card">
                <div className="card-header-with-select">
                  <h2 className="card-title">Asistencia por Grupo</h2>
                  <select 
                    className="period-select"
                    value={barPeriod}
                    onChange={(e) => setBarPeriod(e.target.value)}
                  >
                    {PERIOD_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <AttendanceBarChart data={attendanceBarData} periodLabel={PERIOD_OPTIONS.find(p => p.key === barPeriod)?.label} />
              </div>
            </div>
            <div className="dashboard-horizontal-section attendance-bar-section">
              <div className="dashboard-groups-nav-bar">
                <StudentGroupsNav
                  semesters={semestersData}
                  selectedGroup={selectedGroup}
                  onGroupSelect={handleSelectGroup}
                  activeMode={activeMode}
                />
              </div>
            </div>
          </div>

          {/* Modal para asistencia de grupo */}
          <Modal
            isOpen={isAttendanceModalOpen && !!selectedGroup}
            onClose={() => { setAttendanceModalOpen(false); setSelectedGroup(null); setSelectedGroupName(''); }}
            title={`Asistencia del Grupo ${selectedGroupName || selectedGroup}`}
            size="xl"
          >
            <div className="group-attendance-section-modal">
              {/* Selector de período */}
              <GroupAttendanceCard
                groupName={selectedGroupName || selectedGroup}
                attendanceData={groupAttendanceData}
                selectedPeriod={attendancePeriod}
                onPeriodChange={setAttendancePeriod}
                isLoading={isGroupLoading}
                onCustomDateChange={handleCustomDateChange}
              />

              {/* Gráfica de métricas estilo Facebook */}
              {isLoadingMetrics && (
                <div className="loading-message" style={{ padding: '40px', textAlign: 'center' }}>
                  Cargando métricas diarias...
                </div>
              )}

              {!isLoadingMetrics && metricsData && metricsData.datos && metricsData.datos.length > 0 && (
                <AttendanceMetricsChart
                  datos={metricsData.datos}
                  promedio={metricsData.promedio}
                  periodo={attendancePeriod}
                  totalEstudiantes={metricsData.total_estudiantes}
                />
              )}

              {!isLoadingMetrics && (!metricsData || !metricsData.datos || metricsData.datos.length === 0) && (
                <div className="metrics-chart-empty" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                  <p>No hay datos de asistencia disponibles para el periodo seleccionado</p>
                </div>
              )}
            </div>
          </Modal>
            </>
          )}
        </>
      )}
      </main>
    </PageContainer>
  );
};

export default DashboardPage;