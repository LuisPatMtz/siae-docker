import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios'; // ¡Importamos nuestro cliente API!

import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import StatsCard from '../components/Dashboard/StatsCard.jsx';
import StudentGroupsNav from '../components/Dashboard/StudentGroupsNav.jsx';
import GroupAttendanceCard from '../components/Dashboard/GroupAttendanceCard.jsx';

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

  
  // *** INTERRUPTOR #1: Cargar datos del TURNO (StatsCard) ***
  useEffect(() => {
    setIsTurnLoading(true);
    const fetchTurnData = async () => {
      try {
        // --- CAMBIO: La API solo trae las estadísticas ---
        const response = await apiClient.get(`/dashboard/turno?modo=${activeMode}`);
        const apiData = response.data;
        // ----------------------------------------
        
        // Solo actualizamos las estadísticas
        setStatsData(apiData.stats); 
        
        // Ya NO actualizamos 'semestersData', porque es fijo
        // setSemestersData(apiData.groups); // <--- LÍNEA ELIMINADA
        
        setSelectedGroup(null); 
        setGroupAttendanceData(null); 
      } catch (error) {
        console.error("Error al obtener datos del turno:", error);
        // Si falla (ej. 404), mostrar datos vacíos
        setStatsData({ totalStudents: 0, averageAttendance: 0.0 });
        // No tocamos semestersData, se queda con la lista fija
      } finally {
        setIsTurnLoading(false);
      }
    };
    
    fetchTurnData();
    
  }, [activeMode]); // Se ejecuta solo cuando 'activeMode' cambia


  // *** INTERRUPTOR #2: Cargar datos de ASISTENCIA POR GRUPO/PERIODO ***
  // (Esta lógica no cambia, sigue funcionando igual)
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
        // Si falla (ej. 404), seteamos a null para que la tarjeta muestre "0"
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
      <div className="page-title-container">
        <h1 className="page-title">INICIO</h1>
        <div className="title-decorator"></div>
      </div>

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
              semesters={semestersData} // Pasa los grupos reales organizados por semestre
              selectedGroup={selectedGroup}
              onGroupSelect={handleSelectGroup}
              activeMode={activeMode} // Pasar el modo activo para mostrar información contextual
            />
          </div>
          
          <div className="group-attendance-section">
            <GroupAttendanceCard 
              groupName={selectedGroup}
              attendanceData={groupAttendanceData} // Pasa los datos (o null si no hay)
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