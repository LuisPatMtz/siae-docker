import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para leer tarjetas NFC usando ACR122
 * Usa Web HID API para comunicarse con el lector como dispositivo HID
 */
export function useACR122Reader(isActive = true) {
  const [nfcData, setNfcData] = useState(null);
  const [isReaderConnected, setIsReaderConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isReading, setIsReading] = useState(false);

  const deviceRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const inputBufferRef = useRef('');
  const lastInputTimeRef = useRef(Date.now());

  // Conectar al lector ACR122 usando Web HID
  const connectReader = async () => {
    try {
      if (!('hid' in navigator)) {
        throw new Error('Web HID API no soportada. Usa Chrome 89+ o Edge 89+.');
      }

      // Solicitar dispositivo HID (ACR122)
      const devices = await navigator.hid.requestDevice({
        filters: [
          { vendorId: 0x072f, productId: 0x2200 }, // ACR122U
          { vendorId: 0x072f } // Cualquier dispositivo ACS
        ]
      });

      if (devices.length === 0) {
        throw new Error('No se seleccionó ningún dispositivo');
      }

      const device = devices[0];

      if (!device.opened) {
        await device.open();
      }

      deviceRef.current = device;
      setIsReaderConnected(true);
      setError(null);

      // Escuchar eventos de entrada
      device.addEventListener('inputreport', handleInputReport);

      console.log('✅ ACR122 conectado exitosamente (HID)');

      // Iniciar polling
      startPolling();

      return true;
    } catch (err) {
      console.error('❌ Error conectando ACR122:', err);
      setError(err.message);
      setIsReaderConnected(false);
      return false;
    }
  };

  // Manejar reporte de entrada HID
  const handleInputReport = (event) => {
    const { data, reportId } = event;
    console.log('HID Input Report:', reportId, new Uint8Array(data.buffer));

    // Procesar datos del reporte
    processHIDData(new Uint8Array(data.buffer));
  };

  // Procesar datos HID
  const processHIDData = (data) => {
    // El ACR122 en modo HID envía datos como teclado
    // Extraer caracteres ASCII
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte >= 0x20 && byte <= 0x7E) { // Caracteres imprimibles ASCII
        inputBufferRef.current += String.fromCharCode(byte);
        lastInputTimeRef.current = Date.now();
      } else if (byte === 0x0D || byte === 0x0A) { // Enter
        processCompleteUID();
      }
    }

    // Auto-procesar si han pasado 100ms sin nueva entrada
    setTimeout(() => {
      if (Date.now() - lastInputTimeRef.current >= 100 && inputBufferRef.current.length > 0) {
        processCompleteUID();
      }
    }, 100);
  };

  // Procesar UID completo
  const processCompleteUID = () => {
    const uid = inputBufferRef.current.trim();

    // Soporta tarjetas NFC (8 chars) y stickers NFC (14+ chars)
    if (uid.length >= 8 && uid.length <= 20 && /^[0-9A-F]+$/i.test(uid)) {
      console.log('✅ UID detectado:', uid);
      setNfcData({
        uid: uid.toUpperCase(),
        timestamp: Date.now(),
        readerType: 'ACR122 (HID)'
      });
    }

    inputBufferRef.current = '';
  };

  // Polling continuo para lectura (solo monitoreo del buffer)
  const startPolling = () => {
    // El ACR122 en modo HID envía datos automáticamente
    // Solo necesitamos verificar el buffer periódicamente
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      if (Date.now() - lastInputTimeRef.current >= 100 && inputBufferRef.current.length > 0) {
        processCompleteUID();
      }
    }, 100);
  };

  // Detener polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Leer tarjeta manualmente
  const readCardUID = () => {
    setIsReading(true);
    // En modo HID, solo esperamos datos
    // La tarjeta enviará su UID automáticamente cuando se detecte
    setTimeout(() => {
      setIsReading(false);
      if (!nfcData) {
        setError('No se detectó tarjeta. Acércala al lector.');
      }
    }, 3000); // 3 segundos de timeout
  };

  // Desconectar lector
  const disconnectReader = async () => {
    try {
      stopPolling();

      if (deviceRef.current) {
        deviceRef.current.removeEventListener('inputreport', handleInputReport);
        await deviceRef.current.close();
        deviceRef.current = null;
      }

      setIsReaderConnected(false);
      console.log('🔌 ACR122 desconectado');
    } catch (err) {
      console.error('Error desconectando:', err);
    }
  };

  // Limpiar datos NFC
  const clearNfcData = () => {
    setNfcData(null);
    inputBufferRef.current = '';
  };

  // Efecto para verificar dispositivos HID existentes
  useEffect(() => {
    const checkExistingConnection = async () => {
      if ('hid' in navigator) {
        const devices = await navigator.hid.getDevices();
        const acr122 = devices.find(d => d.vendorId === 0x072f);

        if (acr122 && !acr122.opened) {
          try {
            await acr122.open();
            deviceRef.current = acr122;
            acr122.addEventListener('inputreport', handleInputReport);
            setIsReaderConnected(true);
            startPolling();
            console.log('🔄 Reconectado a ACR122 (HID)');
          } catch (err) {
            console.log('No se pudo reconectar automáticamente:', err);
          }
        }
      }
    };

    if (isActive) {
      checkExistingConnection();
    }

    return () => {
      stopPolling();
    };
  }, [isActive]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnectReader();
    };
  }, []);

  return {
    nfcData,
    isReaderConnected,
    isReading,
    error,
    connectReader,
    disconnectReader,
    clearNfcData,
    manualRead: readCardUID
  };
}
