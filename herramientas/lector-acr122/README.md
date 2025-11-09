# Lector ACR122 - Herramienta de Captura Automática

Esta carpeta contiene el ejecutable para lectura automática de tarjetas NFC con el lector ACR122U.

---

## Descripción

El ejecutable lee automáticamente el UID de tarjetas NFC cuando se acercan al lector ACR122 y lo escribe como si fuera entrada de teclado. Esto permite capturar el UID directamente en el campo de texto del sistema sin necesidad de ingresarlo manualmente.

---

## Requisitos

### Hardware
- Lector ACR122U conectado por USB
- Tarjetas NFC compatibles (MIFARE, NTAG, etc.)

### Software
- Windows 7 o superior
- Driver ACR122 instalado (descargar de acs.com.hk)
- Sistema SIAE corriendo en el navegador

---

## Instalación del Driver

1. Descarga el driver desde:
   https://www.acs.com.hk/en/driver/3/acr122u-usb-nfc-reader/

2. Ejecuta el instalador

3. Conecta el lector ACR122 al puerto USB

4. Verifica la instalación:
   - Abre Administrador de Dispositivos
   - Busca "Lectores de tarjetas inteligentes"
   - Debe aparecer "ACR122 Smart Card Reader"

---

## Modo de Uso

### Preparación

1. Asegúrate de que el lector ACR122 esté conectado

2. Verifica que no haya otras aplicaciones usando el lector:
   - Cierra ACR122T.exe si está abierto
   - Cierra cualquier software de tarjetas NFC

3. Abre el sistema SIAE en tu navegador

### Ejecución

1. Ejecuta el programa:
   ```
   lector-acr122.exe
   ```

2. El programa se quedará en ejecución esperando tarjetas

3. En el sistema SIAE:
   - Ve a Gestión de Estudiantes
   - Pestaña "Vincular Matrícula con NFC"
   - Selecciona un estudiante
   - Haz clic en el botón de vincular

4. Haz clic en el campo de entrada del UID

5. Acerca la tarjeta NFC al lector ACR122

6. El UID se escribirá automáticamente en el campo

7. Haz clic en "Vincular" para guardar

### Detener el Programa

- Presiona Ctrl+C en la ventana del programa
- O simplemente cierra la ventana

---

## Funcionamiento Técnico

El programa funciona de la siguiente manera:

1. Detecta el lector ACR122 conectado al sistema
2. Espera continuamente por tarjetas NFC
3. Cuando detecta una tarjeta:
   - Lee el UID (4-10 bytes)
   - Convierte a formato hexadecimal
   - Simula entrada de teclado escribiendo el UID
   - Presiona Enter automáticamente

---

## Solución de Problemas

### El programa no inicia
- Verifica que el driver ACR122 esté instalado
- Ejecuta como administrador si es necesario
- Verifica que el lector esté conectado

### No detecta tarjetas
- Acerca más la tarjeta al lector (0-5 cm)
- Mantén la tarjeta centrada sobre el lector
- Verifica que el LED del lector esté encendido
- Prueba con otra tarjeta NFC

### El UID no se escribe en el campo
- Asegúrate de que el campo de texto esté enfocado (cursor parpadeando)
- Verifica que no haya otra ventana sobre el navegador
- Cierra otras aplicaciones que puedan capturar el teclado

### Error: "Dispositivo en uso"
- Cierra otras aplicaciones que usen el lector
- Desconecta y reconecta el lector USB
- Reinicia el programa

---

## Formato del UID

El programa genera UIDs en formato hexadecimal:

- Caracteres: 0-9, A-F (mayúsculas)
- Longitud: 8-20 caracteres (según tipo de tarjeta)
- Sin espacios ni guiones
- Ejemplo: `04E8C2D21A2B3C`

---

## Compatibilidad de Tarjetas

El lector ACR122 es compatible con:

- MIFARE Classic 1K/4K (UID 4 bytes)
- MIFARE Ultralight (UID 7 bytes)
- NTAG213/215/216 (UID 7 bytes)
- ISO 14443 Type A (UID 4-10 bytes)

---

## Alternativa: Entrada Manual

Si prefieres no usar este ejecutable, puedes obtener el UID manualmente:

### Método 1: Con Notepad
1. Abre el Bloc de notas
2. Acerca la tarjeta al lector
3. El UID aparecerá como texto
4. Copia y pega en el sistema SIAE

### Método 2: Con Software ACS
1. Descarga ACR122U Tools de acs.com.hk
2. Abre la aplicación
3. Acerca la tarjeta
4. Copia el UID mostrado

---

## Seguridad

### Privacidad
- El programa solo lee el UID público de la tarjeta
- No accede a bloques de memoria protegidos
- No escribe datos en la tarjeta
- No envía información a internet

### Recomendaciones
- Ejecuta solo en equipos confiables
- No compartas los archivos ejecutables
- Mantén el sistema operativo actualizado
- Usa antivirus actualizado

---

## Notas Técnicas

### Dependencias
El programa usa las siguientes librerías:

- PC/SC para comunicación con el lector
- Windows API para simulación de teclado
- Drivers ACR122 de ACS

### Limitaciones
- Solo funciona en Windows
- Requiere que el campo de destino esté enfocado
- No funciona en campos de contraseña
- Una tarjeta a la vez

---

## Información del Lector

### Especificaciones ACR122U
- Fabricante: Advanced Card Systems Ltd.
- Modelo: ACR122U-A9
- Protocolo: ISO 14443 Type A y B
- Frecuencia: 13.56 MHz
- Interfaz: USB 2.0 Full Speed
- Distancia de lectura: 0-50 mm

### Indicadores LED
- LED Rojo: Encendido = lector alimentado
- LED Verde parpadeando: Lectura en progreso
- LED Verde continuo: Tarjeta detectada

---

## Soporte

Para problemas con el ejecutable:
1. Verifica que el driver esté instalado correctamente
2. Prueba con diferentes tarjetas NFC
3. Revisa el Administrador de Dispositivos
4. Consulta la documentación principal: `GUIA_USO_ACR122.md`

Para problemas con el lector:
- Soporte ACS: https://www.acs.com.hk/en/support/
- Manual del usuario: Descargar de acs.com.hk
- Comunidad: Foros de ACS y Stack Overflow

---

## Recursos Adicionales

- Documentación completa: `../../GUIA_USO_ACR122.md`
- Manual ACR122: acs.com.hk/download-manual/419/ACR122U-A9.pdf
- API Reference: acs.com.hk/download-manual/419/API-ACR122U-2.04.pdf
- Drivers: acs.com.hk/en/driver/3/acr122u-usb-nfc-reader/
