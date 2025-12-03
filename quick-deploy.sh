#!/bin/bash

# Script de actualización rápida para producción
# Hace pull del repositorio y despliega automáticamente

set -e  # Salir si hay algún error

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar comando docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}✖ Error: Ni 'docker-compose' ni 'docker compose' están disponibles${NC}"
    exit 1
fi

# Verificar permisos de Docker y agregar sudo si es necesario
SUDO_CMD=""
if ! docker ps > /dev/null 2>&1; then
    if sudo docker ps > /dev/null 2>&1; then
        SUDO_CMD="sudo "
        echo -e "${YELLOW}⚠️  Usando sudo para comandos de Docker${NC}"
    else
        echo -e "${RED}✖ Error: No se puede conectar a Docker${NC}"
        exit 1
    fi
fi

# Actualizar el comando docker compose
DOCKER_COMPOSE="${SUDO_CMD}${DOCKER_COMPOSE}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SIAE - Actualización Rápida                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
    echo -e "${RED}✖ Error: No se encuentra el repositorio git${NC}"
    exit 1
fi

# Mostrar rama actual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}→${NC} Rama actual: ${GREEN}${CURRENT_BRANCH}${NC}"

# Verificar cambios locales
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Tienes cambios locales sin commit${NC}"
    git status -s
    echo ""
    read -p "¿Descartar cambios locales? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        git reset --hard
        git clean -fd
        echo -e "${GREEN}✓ Cambios locales descartados${NC}"
    else
        echo -e "${RED}✖ Actualización cancelada${NC}"
        exit 1
    fi
fi

# Hacer pull
echo -e "\n${BLUE}→${NC} Descargando últimos cambios..."
git fetch origin
git pull origin ${CURRENT_BRANCH}

# Verificar qué archivos cambiaron
CHANGED_FILES=$(git diff --name-only HEAD@{1} HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${GREEN}✓ Ya estás actualizado, no hay cambios${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Archivos modificados:${NC}"
echo "$CHANGED_FILES"
echo ""

# Determinar qué servicios reconstruir
REBUILD_FRONTEND=false
REBUILD_BACKEND=false
REBUILD_ALL=false

if echo "$CHANGED_FILES" | grep -q "siaesistema/"; then
    REBUILD_FRONTEND=true
fi

if echo "$CHANGED_FILES" | grep -q "backend/"; then
    REBUILD_BACKEND=true
fi

if echo "$CHANGED_FILES" | grep -q "$DOCKER_COMPOSE.yml"; then
    REBUILD_ALL=true
fi

if echo "$CHANGED_FILES" | grep -q "default.conf"; then
    REBUILD_ALL=true
fi

# Decidir estrategia de despliegue
if [ "$REBUILD_ALL" = true ]; then
    echo -e "${YELLOW}→ Cambios detectados en configuración Docker${NC}"
    echo -e "${YELLOW}→ Reconstruyendo TODOS los servicios...${NC}"
    $DOCKER_COMPOSE down
    $DOCKER_COMPOSE up -d --build
    
elif [ "$REBUILD_FRONTEND" = true ] && [ "$REBUILD_BACKEND" = true ]; then
    echo -e "${YELLOW}→ Cambios detectados en Frontend y Backend${NC}"
    echo -e "${YELLOW}→ Reconstruyendo ambos servicios...${NC}"
    $DOCKER_COMPOSE build --no-cache frontend backend
    $DOCKER_COMPOSE up -d --no-deps frontend backend
    $DOCKER_COMPOSE restart nginx
    
elif [ "$REBUILD_FRONTEND" = true ]; then
    echo -e "${YELLOW}→ Cambios detectados en Frontend${NC}"
    echo -e "${YELLOW}→ Reconstruyendo Frontend y Nginx...${NC}"
    $DOCKER_COMPOSE build --no-cache frontend
    $DOCKER_COMPOSE up -d --no-deps frontend
    $DOCKER_COMPOSE restart nginx
    
elif [ "$REBUILD_BACKEND" = true ]; then
    echo -e "${YELLOW}→ Cambios detectados en Backend${NC}"
    echo -e "${YELLOW}→ Reconstruyendo Backend...${NC}"
    $DOCKER_COMPOSE build --no-cache backend
    $DOCKER_COMPOSE up -d --no-deps backend
    
else
    echo -e "${BLUE}→ Cambios menores detectados${NC}"
    echo -e "${BLUE}→ Reiniciando servicios...${NC}"
    $DOCKER_COMPOSE restart
fi

# Esperar a que los servicios estén listos
echo -e "\n${BLUE}→${NC} Esperando a que los servicios estén listos..."
sleep 5

# Verificar estado
echo -e "\n${GREEN}✓ Actualización completada${NC}"
echo -e "\n${BLUE}Estado de los servicios:${NC}"
$DOCKER_COMPOSE ps

# Mostrar logs recientes
echo -e "\n${BLUE}Últimos logs:${NC}"
$DOCKER_COMPOSE logs --tail=20

echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Sistema actualizado y desplegado            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
