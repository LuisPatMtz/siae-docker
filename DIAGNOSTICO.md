# 🔍 Diagnóstico de Acceso - SIAE

## Para personas que NO pueden acceder al sitio

Si no puedes acceder a **https://siae.site**, por favor realiza las siguientes pruebas y comparte los resultados:

### 1. Prueba de DNS
```bash
# Windows (CMD o PowerShell)
nslookup siae.site
ping siae.site

# Linux/Mac
dig siae.site
ping -c 4 siae.site
```

**Resultado esperado:** Debería resolver a una IP pública

### 2. Prueba de Conectividad
```bash
# Windows (PowerShell)
Test-NetConnection siae.site -Port 443

# Linux/Mac
telnet siae.site 443
# o
nc -zv siae.site 443
```

**Resultado esperado:** Connection successful

### 3. Prueba desde navegador
Abre estas URLs en tu navegador y anota qué sucede:

- http://siae.site (debería redirigir a HTTPS)
- https://siae.site (debería cargar el sitio)

### 4. Información útil a reportar

Por favor proporciona:
- ✅ Tu ubicación (ciudad/país)
- ✅ Tu proveedor de internet (ISP)
- ✅ Tipo de conexión (WiFi, datos móviles, cable)
- ✅ Navegador y versión
- ✅ Mensaje de error exacto que ves
- ✅ Captura de pantalla del error

### 5. Prueba con VPN o DNS alternativo

Intenta con:
- **Cloudflare DNS:** 1.1.1.1
- **Google DNS:** 8.8.8.8
- **VPN** para cambiar tu ubicación

## Posibles causas y soluciones

### ❌ Error: "No se puede acceder al sitio"
- **Causa:** DNS no propagado o ISP bloqueando
- **Solución:** Cambiar DNS a 1.1.1.1 o 8.8.8.8

### ❌ Error: "Certificado no válido"
- **Causa:** Reloj del sistema desincronizado
- **Solución:** Verificar fecha/hora del sistema

### ❌ Error: "Tiempo de espera agotado"
- **Causa:** Firewall del ISP o red corporativa
- **Solución:** Probar desde otra red o con VPN

### ❌ Error: "ERR_CONNECTION_REFUSED"
- **Causa:** Puerto 443 bloqueado
- **Solución:** Contactar al administrador de red o usar VPN

## Configuración DNS alternativa

### Windows
1. Panel de Control → Redes e Internet → Centro de redes y recursos compartidos
2. Cambiar configuración del adaptador → Propiedades
3. IPv4 → Usar las siguientes direcciones DNS:
   - DNS preferido: `1.1.1.1`
   - DNS alternativo: `8.8.8.8`

### Mac
1. Preferencias del Sistema → Red
2. Avanzado → DNS
3. Agregar: `1.1.1.1` y `8.8.8.8`

### Android
1. Ajustes → Conexiones → WiFi
2. Mantener presionada la red → Modificar
3. Opciones avanzadas → DNS estático
4. DNS1: `1.1.1.1`, DNS2: `8.8.8.8`

### iOS
1. Ajustes → WiFi
2. Tocar (i) en la red conectada
3. Configurar DNS → Manual
4. Agregar: `1.1.1.1` y `8.8.8.8`

---

## Estado del servidor (última verificación)

✅ Servidor en línea
✅ Puerto 80 (HTTP) funcionando
✅ Puerto 443 (HTTPS) funcionando
✅ Certificado SSL válido
✅ Redirección HTTP → HTTPS activa
✅ Backend respondiendo correctamente

**IP del servidor:** (Verificar con `nslookup siae.site`)
**Última actualización:** 3 de diciembre de 2025
