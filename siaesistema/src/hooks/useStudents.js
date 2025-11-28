import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import { useToast } from '../contexts/ToastContext.jsx';

const useStudents = (isLinkListViewVisible) => {
    const [allStudents, setAllStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [semestersData, setSemestersData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Filters
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [linkSelectedGroup, setLinkSelectedGroup] = useState('');
    const [linkNfcFilter, setLinkNfcFilter] = useState('all');

    const { showSuccess, showError } = useToast();

    // Fetch students
    const fetchStudents = useCallback(async () => {
        if (!isLinkListViewVisible) return;

        setIsLoading(true);
        try {
            const response = await apiClient.get('/estudiantes');
            const estudiantesConSemestre = response.data.map(estudiante => ({
                ...estudiante,
                semestre: estudiante.grupo?.semestre || null,
                salon_nombre: estudiante.grupo?.nombre || 'Sin grupo',
                tarjetas: estudiante.nfc ? [estudiante.nfc] : []
            }));

            setAllStudents(estudiantesConSemestre);

            // Create semester structure
            const semestres = {};
            estudiantesConSemestre.forEach(estudiante => {
                if (estudiante.semestre) {
                    if (!semestres[estudiante.semestre]) {
                        semestres[estudiante.semestre] = [];
                    }
                    if (!semestres[estudiante.semestre].includes(estudiante.semestre)) {
                        semestres[estudiante.semestre].push(estudiante.semestre);
                    }
                }
            });
            setSemestersData(semestres);

        } catch (error) {
            console.error("Error al obtener estudiantes:", error);
            showError('Error al cargar estudiantes');
            setAllStudents([]);
        } finally {
            setIsLoading(false);
        }
    }, [isLinkListViewVisible, showError]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Filter logic
    useEffect(() => {
        let filtered = [...allStudents];

        if (linkSearchTerm) {
            const search = linkSearchTerm.toLowerCase();
            filtered = filtered.filter(student =>
                student.nombre.toLowerCase().includes(search) ||
                student.apellido.toLowerCase().includes(search) ||
                student.matricula.toLowerCase().includes(search)
            );
        }

        if (linkSelectedGroup) {
            filtered = filtered.filter(student => student.id_grupo == linkSelectedGroup);
        }

        if (linkNfcFilter === 'linked') {
            filtered = filtered.filter(student =>
                (student.nfc && Object.keys(student.nfc).length > 0) ||
                (student.tarjetas && student.tarjetas.length > 0)
            );
        } else if (linkNfcFilter === 'unlinked') {
            filtered = filtered.filter(student =>
                (!student.nfc || Object.keys(student.nfc).length === 0) &&
                (!student.tarjetas || student.tarjetas.length === 0)
            );
        }

        setFilteredStudents(filtered);
    }, [linkSearchTerm, linkSelectedGroup, linkNfcFilter, allStudents]);

    // Save new student
    const saveStudent = async (studentData) => {
        setIsSaving(true);
        try {
            const response = await apiClient.post('/estudiantes', studentData);
            const savedStudent = response.data;
            showSuccess(`¡Estudiante ${savedStudent.nombre} ${savedStudent.apellido} guardado correctamente!`);
            return true;
        } catch (error) {
            console.error("Error guardando estudiante:", error);
            let errorMsg = 'Error desconocido al guardar estudiante';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;
                if (status === 400) errorMsg = detail || 'Los datos del estudiante son inválidos';
                else if (status === 409) errorMsg = detail || 'La matrícula ya está registrada';
                else if (status === 422) errorMsg = 'Algunos campos tienen formato incorrecto';
                else errorMsg = detail || `Error del servidor (${status})`;
            } else if (error.request) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet';
            }
            showError(errorMsg);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Link NFC
    const linkNfc = async (nfcId, studentToLink) => {
        if (!studentToLink || !nfcId) return false;
        setIsSaving(true);

        const linkData = {
            nfc_uid: nfcId,
            matricula_estudiante: studentToLink.matricula,
        };

        try {
            const response = await apiClient.post('/nfc', linkData);
            const linkedCard = response.data;

            showSuccess(`¡NFC vinculado a ${studentToLink.nombre} ${studentToLink.apellido} correctamente!`);

            // Update local state
            const updateStudentList = (list) => list.map(s =>
                s.matricula === studentToLink.matricula
                    ? { ...s, tarjetas: [linkedCard] }
                    : s
            );

            setFilteredStudents(prev => updateStudentList(prev));
            setAllStudents(prev => updateStudentList(prev));
            return true;

        } catch (error) {
            console.error("Error al vincular NFC:", error);
            const errorMsg = error.response?.data?.detail || 'Error desconocido al vincular.';
            showError(`Error: ${errorMsg}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Bulk change group
    const bulkMoveGroup = async (matriculas, nuevoIdGrupo) => {
        try {
            const payload = {
                matriculas: matriculas,
                nuevo_id_grupo: parseInt(nuevoIdGrupo)
            };

            const response = await apiClient.patch('/estudiantes/bulk-move-group', payload);

            // Refresh students
            await fetchStudents();

            showSuccess(`¡${response.data.estudiantes_afectados} estudiante(s) actualizado(s) correctamente!`);
            return true;
        } catch (error) {
            console.error("Error en cambio masivo:", error);
            const errorMsg = error.response?.data?.detail || 'Error al procesar el cambio masivo';
            showError(errorMsg);
            return false;
        }
    };

    return {
        allStudents,
        filteredStudents,
        semestersData,
        isLoading,
        isSaving,
        linkSearchTerm,
        setLinkSearchTerm,
        linkSelectedGroup,
        setLinkSelectedGroup,
        linkNfcFilter,
        setLinkNfcFilter,
        saveStudent,
        linkNfc,
        bulkMoveGroup,
        fetchStudents,
        setAllStudents // Exposed if needed for manual updates
    };
};

export default useStudents;
