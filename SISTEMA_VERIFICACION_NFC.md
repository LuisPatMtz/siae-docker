# Sistema de Verificación NFC - Triple Lectura

## 🎯 Objetivo
Mejorar la confiabilidad de la vinculación NFC mediante verificación automática de 3 lecturas consecutivas.

## 🔧 Funcionamiento

### Proceso de Verificación Automática

1. **Primera Lectura**
   - Usuario escanea/pega el UID (8 caracteres hexadecimales)
   - El sistema captura: `29115803`
   - Estado: "Lectura 1/3"
   - El input se limpia automáticamente

2. **Segunda Lectura**
   - Usuario escanea nuevamente
   - El sistema captura: `29115803`
   - Estado: "Lectura 2/3"
   - El input se limpia automáticamente

3. **Tercera Lectura**
   - Usuario escanea por última vez
   - El sistema captura: `29115803`
   - Estado: "Verificando..."

4. **Verificación de Consenso**
   - ✅ **Si las 3 lecturas coinciden**: 
     - Muestra "✓ ID verificado: 29115803"
     - Auto-submit después de 500ms
     - Vinculación exitosa
   
   - ❌ **Si alguna lectura difiere**:
     - Muestra error: "Lecturas inconsistentes"
     - Reinicia el proceso
     - Usuario debe escanear 3 veces nuevamente

## 📝 Formato Esperado

```
UID válido: 8 caracteres hexadecimales
Ejemplos:
  ✓ 29115803
  ✓ 7E3B5703
  ✓ B7FC5703
  ✓ FE435603
  
Inválidos:
  ✗ 2911580 (7 caracteres)
  ✗ 291158033 (9 caracteres)
  ✗ ZZZZZZZZ (no hexadecimal)
```

## 🎨 Interfaz de Usuario

### Estados Visuales

```jsx
// Estado 1: Esperando primera lectura
Input: [                    ] ← "Escanee la tarjeta 3 veces..."

// Estado 2: Verificando (1-2 lecturas)
Input: [                    ] ← Disabled
Label: "ID Tarjeta/Tag NFC: (Lectura 1/3)"
Preview: 🔄 Verificando... (1/3 lecturas)

// Estado 3: Verificación exitosa
Input: [                    ] ← Disabled
Preview: ✓ ID verificado: 29115803
Botón: [Guardar Vínculo] ← Enabled (auto-submit en 500ms)

// Estado 4: Error de inconsistencia
Error: "Lecturas inconsistentes. Por favor, vuelva a escanear."
Input: [                    ] ← Re-enabled, auto-focus
```

## 🔐 Seguridad y Confiabilidad

### Ventajas del Sistema

1. **Verificación Triple**: Elimina errores de lectura única
2. **Transparente para el Usuario**: No ve las 3 lecturas individuales
3. **Validación Automática**: Formato hexadecimal de 8 caracteres
4. **Reinicio Automático**: Si falla, limpia y reinicia
5. **Auto-Submit**: Proceso fluido sin clicks adicionales

### Casos de Error Manejados

- **Formato inválido**: Rechaza UIDs no hexadecimales
- **Longitud incorrecta**: Solo acepta exactamente 8 caracteres
- **Lecturas inconsistentes**: Detecta y rechaza variaciones
- **Timeout**: Limpia estado si el usuario no completa

## 🚀 Uso con Lector Externo

### Configuración del Ejecutable

Tu ejecutable debe simular tipeo rápido de 8 caracteres + Enter:

```python
# Ejemplo: Pseudocódigo del ejecutable
while True:
    uid = leer_tarjeta_acr122()  # ej: "29115803"
    if uid:
        simular_teclado(uid + "\n")  # Envía UID + Enter
        time.sleep(0.5)  # Pausa para que el input procese
```

### Flujo Completo

1. Usuario abre modal "Vincular NFC"
2. Input tiene focus automático
3. Usuario acerca tarjeta al lector
4. Ejecutable lee y envía: `29115803↵`
5. Sistema procesa lectura 1/3
6. Usuario acerca tarjeta nuevamente
7. Ejecutable lee y envía: `29115803↵`
8. Sistema procesa lectura 2/3
9. Usuario acerca tarjeta por tercera vez
10. Ejecutable lee y envía: `29115803↵`
11. Sistema verifica consenso
12. Auto-submit si coinciden
13. Vinculación guardada en DB

## 🧪 Pruebas Manuales

Para probar sin lector físico:

1. Abre el modal de vinculación
2. Escribe/pega `29115803` → Enter
3. Escribe/pega `29115803` → Enter
4. Escribe/pega `29115803` → Enter
5. Debe auto-guardar después de la tercera

Para probar detección de errores:

1. Abre el modal
2. Escribe `29115803` → Enter
3. Escribe `7E3B5703` → Enter (diferente)
4. Debe mostrar error y reiniciar

## 📊 Logs de Desarrollo

### Cambios Implementados

- `LinkNfcModal.jsx`: Lógica de triple lectura y verificación
- `Dashboard.css`: Estilos para estados `.verifying` y `.reading-status`
- Validación: Regex `/^[0-9A-F]{8}$/`
- Auto-submit: 500ms después de consenso exitoso
- Error handling: Reset automático con re-focus

### Variables de Estado

```javascript
nfcId          // UID verificado final
error          // Mensajes de error
readingsCount  // 0, 1, 2, o 3
isVerifying    // true durante el proceso
readingsRef    // Array de las 3 lecturas
```

## ✅ Checklist de Implementación

- [x] Validación de formato (8 hex)
- [x] Contador de lecturas (1/3, 2/3, 3/3)
- [x] Verificación de consenso
- [x] Auto-submit después de éxito
- [x] Reinicio en caso de inconsistencia
- [x] Estilos visuales diferenciados
- [x] Input limpiado entre lecturas
- [x] Disabled durante verificación final
- [x] Mensajes de estado claros

---

**Última actualización**: 8 de Noviembre, 2025  
**Versión**: 1.0  
**Sistema**: SIAE - Sistema Integral de Asistencia Estudiantil
