import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import StatsCard from '../components/Dashboard/StatsCard.jsx';
import AttendanceBarChart from '../components/Dashboard/AttendanceBarChart.jsx';
import Modal from '../components/UI/Modal.jsx';
import StudentGroupsNav from '../components/Dashboard/StudentGroupsNav.jsx';
import GroupAttendanceCard from '../components/Dashboard/GroupAttendanceCard.jsx';
import PeriodStatsCard from '../components/Dashboard/PeriodStatsCard.jsx';

const DashboardPage = () => {
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
  const [attendancePeriod, setAttendancePeriod] = useState('semester');
  const [groupAttendanceData, setGroupAttendanceData] = useState(null);
  const [isTurnLoading, setIsTurnLoading] = useState(true);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [isLoadingPeriodStats, setIsLoadingPeriodStats] = useState(false);

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
          const period = barPeriod === 'day' ? 'week' : barPeriod; // backend no tiene 'day', usamos 'week' como aproximación
          const res = await apiClient.get(`/dashboard/grupo/${g.id}?periodo=${period}`);
          return { name: g.name, attendance: res.data.attendance[period] || 0 };
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
      const response = await apiClient.get(`/dashboard/turno?modo=${activeMode}`);
      const apiData = response.data;
      // 2. Obtener todos los grupos (con id y nombre)
      const gruposResponse = await apiClient.get('/grupos');
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
          const res = await apiClient.get(`/dashboard/grupo/${grupo.id}`);
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
        acc[semestreKey].push(grupo.nombre || `Grupo ${grupo.id}`);
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
      const url = `/dashboard/estadisticas/periodos${params ? '?' + params : ''}`;

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
        const response = await apiClient.get(`/dashboard/turno?modo=${activeMode}`);
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

    setIsGroupLoading(true);

    const fetchGroupData = async () => {
      try {
        const response = await apiClient.get(
          `/dashboard/grupo/${selectedGroup}?periodo=${attendancePeriod}`
        );
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

  }, [selectedGroup, attendancePeriod]);


  // Wrapper para el selector de grupo que resetea el período
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setAttendancePeriod('semester'); // Resetea el filtro a 'Total Semestre'
    setAttendanceModalOpen(true);
  };


  return (
    <main className="dashboard-main">
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
                <h2 className="card-title">Asistencia por Grupo</h2>
                <div className="bar-period-selectors">
                  {PERIOD_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      className={`bar-period-btn ${barPeriod === option.key ? 'active' : ''}`}
                      onClick={() => setBarPeriod(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
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
            onClose={() => { setAttendanceModalOpen(false); setSelectedGroup(null); }}
            title={`Asistencia del Grupo ${selectedGroup || ''}`}
            size="md"
          >
            <div className="group-attendance-section-modal">
              {/* Mostrar estadísticas por período si hay un grupo seleccionado */}
              {selectedGroup && !isLoadingPeriodStats && periodStatsData && (
                <PeriodStatsCard
                  periodData={periodStatsData}
                  selectedPeriod={attendancePeriod}
                />
              )}
              <GroupAttendanceCard
                groupName={selectedGroup}
                attendanceData={groupAttendanceData}
                selectedPeriod={attendancePeriod}
                onPeriodChange={setAttendancePeriod}
                isLoading={isGroupLoading}
              />
            </div>
          </Modal>
        </>
      )}
    </main>
  );
};

export default DashboardPage;