# 🚀 Guía Rápida de Diagnóstico

## Para el Administrador

### Ejecutar Diagnóstico Completo
```bash
cd /home/pato/SIAE/siae-docker
./diagnostico.sh
```

### Ver Logs en Tiempo Real
```bash
# Nginx
sudo docker logs -f siae-nginx

# Backend
sudo docker logs -f siae-backend

# Frontend
sudo docker logs -f siae-frontend

# Todos a la vez
sudo docker compose logs -f
```

### Verificar Conexiones Activas
```bash
# Ver quién está conectado
sudo netstat -an | grep ':443' | grep ESTABLISHED

# Contar conexiones
sudo netstat -an | grep ':443' | grep ESTABLISHED | wc -l
```

### Reiniciar Servicios
```bash
cd /home/pato/SIAE/siae-docker

# Solo nginx
sudo docker compose restart nginx

# Solo frontend
sudo docker compose up -d --build --no-deps frontend

# Todo el sistema
sudo docker compose restart
```

### Verificar Estado de Servicios
```bash
sudo docker compose ps
sudo docker compose top
```

---

## Archivos Creados para Soporte

1. **DIAGNOSTICO.md** - Compartir con usuarios que no pueden acceder
2. **RESUMEN_DIAGNOSTICO.md** - Información técnica completa
3. **diagnostico.sh** - Script automatizado de diagnóstico
4. **Este archivo** - Referencia rápida

---

## Comandos Útiles de Debugging

### Test de Conectividad Externa
```bash
# Desde el servidor hacia el sitio
curl -I https://siae.site

# Test de velocidad
time curl -s -o /dev/null https://siae.site

# Test con detalles
curl -v https://siae.site 2>&1 | grep -E '(HTTP|SSL)'
```

### Verificar Certificado SSL
```bash
# Ver detalles del certificado
echo | openssl s_client -connect siae.site:443 2>/dev/null | openssl x509 -noout -dates

# Test de SSL
openssl s_client -connect siae.site:443 -servername siae.site < /dev/null
```

### Monitorear Recursos
```bash
# CPU y RAM de contenedores
sudo docker stats --no-stream

# Espacio en disco
df -h

# Logs más recientes con errores
sudo docker logs siae-nginx 2>&1 | grep -i error | tail -20
```

---

## Respuestas Rápidas para Usuarios

### "No puedo acceder al sitio"
```
1. ¿Desde qué red? (WiFi casa, datos móviles, trabajo)
2. ¿Qué error ves exactamente?
3. Prueba cambiar DNS a 1.1.1.1
4. Intenta con otro navegador
5. Usa VPN temporalmente
```

### "El sitio es muy lento"
```
1. ¿En qué parte es lento? (carga inicial, navegación)
2. ¿Desde qué dispositivo?
3. Ejecuta: ./diagnostico.sh
4. Revisa logs: sudo docker logs siae-nginx --tail 100
5. Verifica uso de recursos: sudo docker stats
```

### "Veo error de certificado"
```
1. Verifica fecha/hora de tu dispositivo
2. Actualiza tu navegador
3. Limpia caché del navegador
4. Prueba en modo incógnito
```

---

## Escalamiento Futuro

### Si el tráfico aumenta mucho:

1. **Agregar Cloudflare** (CDN + DDoS protection)
2. **Configurar caché** en nginx
3. **Escalar backend** (múltiples instancias)
4. **Monitoreo automático** (UptimeRobot, Pingdom)
5. **Logs centralizados** (ELK Stack, Grafana)

### Optimizaciones Adicionales:

```nginx
# En default.conf, agregar caché:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

---

## Contactos de Emergencia

- **Proveedor de Hosting:** [AGREGAR]
- **Registro de Dominio:** [AGREGAR]
- **Soporte DNS:** [AGREGAR]

---

**Creado:** 3 de diciembre de 2025
