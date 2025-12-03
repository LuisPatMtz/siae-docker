#!/bin/bash

# Script de diagnóstico del servidor SIAE
# Ejecuta pruebas para verificar conectividad y configuración

echo "=================================================="
echo "  🔍 DIAGNÓSTICO DEL SERVIDOR SIAE"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Estado de contenedores
echo -e "${YELLOW}1. Estado de Contenedores Docker:${NC}"
sudo docker compose ps
echo ""

# 2. Puertos escuchando
echo -e "${YELLOW}2. Puertos HTTP/HTTPS:${NC}"
sudo netstat -tulpn | grep -E ':(80|443)' || echo -e "${RED}No se encontraron puertos abiertos${NC}"
echo ""

# 3. Test de conectividad local
echo -e "${YELLOW}3. Test de Conectividad Local:${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "301"; then
    echo -e "${GREEN}✓ HTTP (80) funcionando - Redirección correcta${NC}"
else
    echo -e "${RED}✗ HTTP (80) no responde correctamente${NC}"
fi

if curl -s -k -o /dev/null -w "%{http_code}" https://localhost | grep -q "200"; then
    echo -e "${GREEN}✓ HTTPS (443) funcionando${NC}"
else
    echo -e "${RED}✗ HTTPS (443) no responde${NC}"
fi
echo ""

# 4. Test de dominio público
echo -e "${YELLOW}4. Test de Dominio Público (siae.site):${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://siae.site | grep -q "200"; then
    echo -e "${GREEN}✓ Sitio accesible desde el servidor${NC}"
else
    echo -e "${RED}✗ Sitio no accesible${NC}"
fi
echo ""

# 5. Resolución DNS
echo -e "${YELLOW}5. Resolución DNS:${NC}"
host siae.site | grep "has address" || echo -e "${RED}DNS no resuelve${NC}"
echo ""

# 6. Certificado SSL
echo -e "${YELLOW}6. Certificado SSL:${NC}"
if [ -f "/home/pato/SIAE/siae-docker/certs/live/siae.site/fullchain.pem" ]; then
    echo -e "${GREEN}✓ Certificado encontrado${NC}"
    echo "Validez:"
    sudo openssl x509 -in /home/pato/SIAE/siae-docker/certs/live/siae.site/fullchain.pem -noout -dates 2>/dev/null || echo "No se puede leer el certificado"
else
    echo -e "${RED}✗ Certificado no encontrado${NC}"
fi
echo ""

# 7. Logs recientes de nginx
echo -e "${YELLOW}7. Últimas 10 líneas de logs de Nginx:${NC}"
sudo docker logs siae-nginx --tail 10 2>&1 | tail -10
echo ""

# 8. Conexiones activas
echo -e "${YELLOW}8. Conexiones Activas:${NC}"
sudo netstat -an | grep -E ':(80|443)' | grep ESTABLISHED | wc -l | xargs echo "Conexiones activas:"
echo ""

# 9. Firewall
echo -e "${YELLOW}9. Estado del Firewall:${NC}"
sudo ufw status
echo ""

# 10. Uso de recursos
echo -e "${YELLOW}10. Uso de Recursos:${NC}"
echo "CPU y Memoria de contenedores:"
sudo docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# 11. Test de velocidad de respuesta
echo -e "${YELLOW}11. Tiempo de Respuesta:${NC}"
echo "Midiendo tiempo de respuesta..."
time curl -s -o /dev/null https://siae.site
echo ""

# 12. Verificar si hay errores en logs
echo -e "${YELLOW}12. Errores Recientes en Logs:${NC}"
sudo docker logs siae-nginx 2>&1 | grep -i error | tail -5 || echo -e "${GREEN}No hay errores recientes${NC}"
echo ""

echo "=================================================="
echo "  ✅ DIAGNÓSTICO COMPLETADO"
echo "=================================================="
echo ""
echo "Para compartir con usuarios que no pueden acceder:"
echo "1. Compartir archivo: /home/pato/SIAE/siae-docker/DIAGNOSTICO.md"
echo "2. Solicitar pruebas de conectividad desde su ubicación"
echo "3. Verificar si usan VPN o proxy corporativo"
echo ""
