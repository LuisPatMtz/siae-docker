import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import StatsCard from '../components/Dashboard/StatsCard.jsx';
import StudentGroupsNav from '../components/Dashboard/StudentGroupsNav.jsx';
import GroupAttendanceCard from '../components/Dashboard/GroupAttendanceCard.jsx';
import PeriodStatsCard from '../components/Dashboard/PeriodStatsCard.jsx';

const DashboardPage = () => {
  const [activeMode, setActiveMode] = useState('general');
  const [statsData, setStatsData] = useState({ totalStudents: 0, averageAttendance: 0.0 });
  
  // Estados para gestión de grupos reales
  const [grupos, setGrupos] = useState([]);
  const [semestersData, setSemestersData] = useState({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [attendancePeriod, setAttendancePeriod] = useState('semester');
  const [groupAttendanceData, setGroupAttendanceData] = useState(null);
  const [isTurnLoading, setIsTurnLoading] = useState(true);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  
  // Estado para estadísticas por períodos
  const [periodStatsData, setPeriodStatsData] = useState(null);
  const [isLoadingPeriodStats, setIsLoadingPeriodStats] = useState(false);

  // Función para cargar grupos desde la API
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await apiClient.get('/grupos');
      const groupsData = response.data;
      setGrupos(groupsData);
      
      // Organizar grupos por semestre y filtrar por turno activo
      organizarGruposPorSemestre(groupsData);
      
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      setGrupos([]);
      setSemestersData({});
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

  // Función para organizar grupos por semestre y filtrar por turno
  const organizarGruposPorSemestre = (groupsData) => {
    // Filtrar grupos por turno activo (si no es 'general')
    const gruposFiltrados = activeMode === 'general' 
      ? groupsData 
      : groupsData.filter(grupo => grupo.turno?.toLowerCase() === activeMode.toLowerCase());

    // Organizar por semestre
    const gruposOrganizados = gruposFiltrados.reduce((acc, grupo) => {
      const semestreKey = `${grupo.semestre}er Semestre`;
      
      if (!acc[semestreKey]) {
        acc[semestreKey] = [];
      }
      
      // Agregar el nombre del grupo a la lista del semestre
      acc[semestreKey].push(grupo.nombre || `Grupo ${grupo.id}`);
      
      return acc;
    }, {});

    setSemestersData(gruposOrganizados);
  };

  // Cargar grupos al montar el componente
  useEffect(() => {
    fetchGroups();
  }, []);

  // Reorganizar grupos cuando cambie el modo activo
  useEffect(() => {
    if (grupos.length > 0) {
      organizarGruposPorSemestre(grupos);
    }
  }, [activeMode, grupos]);

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
        
        // Solo actualizamos las estadísticas
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
    
  }, [activeMode]); // Se ejecuta solo cuando 'activeMode' cambia


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
  };


  return (
    <main className="dashboard-main">
      <DashboardControls 
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      {(isTurnLoading || isLoadingGroups) ? (
        <div className="loading-message">
          {isTurnLoading && isLoadingGroups ? 'Cargando datos del dashboard...' :
           isTurnLoading ? 'Cargando datos del turno...' :
           'Cargando grupos...'}
        </div>
      ) : (
        <>
          <div className="widgets-grid">
            <StatsCard 
              title={`Datos de la Sección ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}`}
              totalStudents={statsData.totalStudents}
              averageAttendance={statsData.averageAttendance}
            />
            <StudentGroupsNav 
              semesters={semestersData}
              selectedGroup={selectedGroup}
              onGroupSelect={handleSelectGroup}
              activeMode={activeMode}
            />
          </div>

          <div className="group-attendance-section">
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
        </>
      )}
    </main>
  );
};

export default DashboardPage;