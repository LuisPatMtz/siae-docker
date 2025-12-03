#!/bin/bash

# Script de despliegue selectivo para SIAE
# Autor: Sistema SIAE
# Fecha: 2025

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Detectar comando docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}✖ Error: Ni 'docker-compose' ni 'docker compose' están disponibles${NC}"
    exit 1
fi

# Banner
clear
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}║     ${BOLD}SIAE - Sistema de Despliegue${NC}${CYAN}           ║${NC}"
echo -e "${CYAN}║     ${BOLD}Deployment & Rebuild Manager${NC}${CYAN}           ║${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar el menú principal
show_menu() {
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  ¿Qué deseas hacer?${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}[1]${NC} 🔄 Reconstruir ${BOLD}TODO${NC} (Full rebuild)"
    echo -e "${GREEN}[2]${NC} 🎨 Reconstruir solo ${BOLD}FRONTEND${NC} + Nginx"
    echo -e "${GREEN}[3]${NC} ⚙️  Reconstruir solo ${BOLD}BACKEND${NC}"
    echo -e "${GREEN}[4]${NC} 🗄️  Reconstruir solo ${BOLD}PostgreSQL${NC}"
    echo -e "${GREEN}[5]${NC} 🌐 Reiniciar solo ${BOLD}NGINX${NC} (sin rebuild)"
    echo ""
    echo -e "${YELLOW}[6]${NC} 📊 Ver estado de contenedores"
    echo -e "${YELLOW}[7]${NC} 📋 Ver logs"
    echo -e "${YELLOW}[8]${NC} 🧹 Limpiar sistema Docker"
    echo -e "${YELLOW}[9]${NC} 🔌 Detener todo"
    echo ""
    echo -e "${RED}[0]${NC} 🚪 Salir"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
}

# Función para confirmar acción
confirm_action() {
    local message="$1"
    echo ""
    echo -e "${YELLOW}⚠️  $message${NC}"
    read -p "¿Continuar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        echo -e "${RED}✖ Operación cancelada${NC}"
        return 1
    fi
    return 0
}

# Función para mostrar spinner de carga
show_spinner() {
    local pid=$1
    local message="$2"
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %10 ))
        printf "\r${CYAN}${spin:$i:1}${NC} $message..."
        sleep 0.1
    done
    printf "\r${GREEN}✓${NC} $message... ${GREEN}Completado${NC}\n"
}

# Función para reconstruir todo
rebuild_all() {
    echo -e "\n${BOLD}${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Reconstruyendo TODOS los servicios...        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}\n"
    
    if confirm_action "Esto detendrá todos los contenedores y los reconstruirá"; then
        echo -e "${BLUE}→${NC} Deteniendo contenedores..."
        $DOCKER_COMPOSE down
        
        echo -e "${BLUE}→${NC} Reconstruyendo imágenes..."
        $DOCKER_COMPOSE build --no-cache
        
        echo -e "${BLUE}→${NC} Iniciando servicios..."
        $DOCKER_COMPOSE up -d
        
        echo -e "\n${GREEN}✓ Despliegue completo finalizado${NC}"
        show_status
    fi
}

# Función para reconstruir solo frontend + nginx
rebuild_frontend() {
    echo -e "\n${BOLD}${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Reconstruyendo FRONTEND + NGINX...            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}\n"
    
    if confirm_action "Esto reconstruirá el frontend y reiniciará nginx"; then
        echo -e "${BLUE}→${NC} Reconstruyendo frontend..."
        $DOCKER_COMPOSE build --no-cache frontend
        
        echo -e "${BLUE}→${NC} Reiniciando frontend..."
        $DOCKER_COMPOSE up -d --no-deps frontend
        
        echo -e "${BLUE}→${NC} Reiniciando nginx..."
        $DOCKER_COMPOSE restart nginx
        
        echo -e "\n${GREEN}✓ Frontend y Nginx actualizados${NC}"
        show_status
    fi
}

# Función para reconstruir solo backend
rebuild_backend() {
    echo -e "\n${BOLD}${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Reconstruyendo BACKEND...                     ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}\n"
    
    if confirm_action "Esto reconstruirá el backend API"; then
        echo -e "${BLUE}→${NC} Reconstruyendo backend..."
        $DOCKER_COMPOSE build --no-cache backend
        
        echo -e "${BLUE}→${NC} Reiniciando backend..."
        $DOCKER_COMPOSE up -d --no-deps backend
        
        echo -e "\n${GREEN}✓ Backend actualizado${NC}"
        show_status
    fi
}

# Función para reconstruir solo PostgreSQL
rebuild_postgres() {
    echo -e "\n${BOLD}${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  ADVERTENCIA: PostgreSQL                  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${RED}⚠️  IMPORTANTE:${NC}"
    echo -e "   - Esto eliminará TODOS los datos actuales"
    echo -e "   - Los volúmenes persistentes serán eliminados"
    echo -e "   - Se recomienda hacer backup primero"
    echo ""
    
    if confirm_action "¿ESTÁS SEGURO de reconstruir PostgreSQL?"; then
        echo -e "${YELLOW}→${NC} Deteniendo PostgreSQL..."
        $DOCKER_COMPOSE stop db
        
        echo -e "${YELLOW}→${NC} Eliminando volúmenes..."
        $DOCKER_COMPOSE down -v
        
        echo -e "${YELLOW}→${NC} Reconstruyendo PostgreSQL..."
        $DOCKER_COMPOSE up -d db
        
        echo -e "\n${GREEN}✓ PostgreSQL reconstruido${NC}"
        echo -e "${YELLOW}⚠️  Recuerda ejecutar las migraciones necesarias${NC}"
        show_status
    fi
}

# Función para reiniciar solo nginx
restart_nginx() {
    echo -e "\n${BOLD}${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Reiniciando NGINX...                          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${BLUE}→${NC} Reiniciando nginx..."
    $DOCKER_COMPOSE restart nginx
    
    echo -e "\n${GREEN}✓ Nginx reiniciado${NC}"
    show_status
}

# Función para mostrar estado
show_status() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  Estado de los contenedores${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"
    $DOCKER_COMPOSE ps
    echo ""
}

# Función para mostrar logs
show_logs() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  ¿De qué servicio quieres ver los logs?${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"
    echo -e "${GREEN}[1]${NC} Todos los servicios"
    echo -e "${GREEN}[2]${NC} Frontend"
    echo -e "${GREEN}[3]${NC} Backend"
    echo -e "${GREEN}[4]${NC} Nginx"
    echo -e "${GREEN}[5]${NC} PostgreSQL"
    echo ""
    read -p "Selecciona una opción: " log_option
    
    case $log_option in
        1)
            echo -e "\n${CYAN}Mostrando logs de todos los servicios (Ctrl+C para salir)${NC}\n"
            $DOCKER_COMPOSE logs -f --tail=100
            ;;
        2)
            echo -e "\n${CYAN}Mostrando logs del frontend (Ctrl+C para salir)${NC}\n"
            $DOCKER_COMPOSE logs -f --tail=100 frontend
            ;;
        3)
            echo -e "\n${CYAN}Mostrando logs del backend (Ctrl+C para salir)${NC}\n"
            $DOCKER_COMPOSE logs -f --tail=100 backend
            ;;
        4)
            echo -e "\n${CYAN}Mostrando logs de nginx (Ctrl+C para salir)${NC}\n"
            $DOCKER_COMPOSE logs -f --tail=100 nginx
            ;;
        5)
            echo -e "\n${CYAN}Mostrando logs de PostgreSQL (Ctrl+C para salir)${NC}\n"
            $DOCKER_COMPOSE logs -f --tail=100 db
            ;;
        *)
            echo -e "${RED}✖ Opción inválida${NC}"
            ;;
    esac
}

# Función para limpiar sistema Docker
clean_docker() {
    echo -e "\n${BOLD}${YELLOW}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  Limpieza del sistema Docker                   ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${YELLOW}Esto eliminará:${NC}"
    echo -e "  - Contenedores detenidos"
    echo -e "  - Redes no utilizadas"
    echo -e "  - Imágenes sin tag"
    echo -e "  - Caché de build"
    echo ""
    
    if confirm_action "¿Limpiar el sistema Docker?"; then
        echo -e "${BLUE}→${NC} Limpiando sistema..."
        docker system prune -a -f
        echo -e "\n${GREEN}✓ Sistema Docker limpiado${NC}"
        
        # Mostrar espacio liberado
        echo -e "\n${CYAN}Espacio en disco:${NC}"
        df -h | grep -E "Filesystem|/dev/sda"
    fi
}

# Función para detener todo
stop_all() {
    echo -e "\n${BOLD}${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  Deteniendo todos los servicios...             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    
    if confirm_action "Esto detendrá todos los contenedores"; then
        $DOCKER_COMPOSE down
        echo -e "\n${GREEN}✓ Todos los servicios detenidos${NC}"
    fi
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✖ Error: No se encontró docker-compose.yml${NC}"
    echo -e "${YELLOW}  Asegúrate de estar en el directorio raíz del proyecto${NC}"
    exit 1
fi

# Verificar que Docker está corriendo y configurar el comando apropiado
SUDO_CMD=""
if ! docker ps > /dev/null 2>&1; then
    # Intentar con sudo
    if sudo docker ps > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Necesitas permisos de sudo para usar Docker${NC}"
        echo -e "${CYAN}→ Usando sudo para los comandos de Docker${NC}"
        SUDO_CMD="sudo "
        echo ""
    else
        echo -e "${RED}✖ Error: No se puede conectar a Docker${NC}"
        echo -e "${YELLOW}  Verifica que:${NC}"
        echo -e "${YELLOW}  1. El servicio Docker está corriendo: sudo systemctl status docker${NC}"
        echo -e "${YELLOW}  2. Tu usuario tiene permisos: sudo usermod -aG docker \$USER${NC}"
        echo -e "${YELLOW}  3. Has reiniciado la sesión después de agregar permisos${NC}"
        exit 1
    fi
fi

# Actualizar el comando docker compose para usar sudo si es necesario
DOCKER_COMPOSE="${SUDO_CMD}${DOCKER_COMPOSE}"

# Loop principal
while true; do
    show_menu
    read -p "Selecciona una opción: " option
    
    case $option in
        1)
            rebuild_all
            ;;
        2)
            rebuild_frontend
            ;;
        3)
            rebuild_backend
            ;;
        4)
            rebuild_postgres
            ;;
        5)
            restart_nginx
            ;;
        6)
            show_status
            ;;
        7)
            show_logs
            ;;
        8)
            clean_docker
            ;;
        9)
            stop_all
            ;;
        0)
            echo -e "\n${GREEN}👋 ¡Hasta luego!${NC}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}✖ Opción inválida. Por favor selecciona un número del 0 al 9.${NC}\n"
            sleep 2
            clear
            ;;
    esac
    
    # Pausa antes de volver al menú
    echo ""
    read -p "Presiona Enter para volver al menú principal..."
    clear
done
