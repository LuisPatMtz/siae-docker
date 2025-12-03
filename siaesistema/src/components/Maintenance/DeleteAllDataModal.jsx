import React, { useState } from 'react';
import { AlertTriangle, Trash2, Lock, X } from 'lucide-react';
import './DeleteAllDataModal.css';

const DeleteAllDataModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1); // 1: advertencia, 2: confirmación con contraseña

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    setStep(1);
    onClose();
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleConfirm = async () => {
    if (confirmText !== 'ELIMINAR TODO' || !password.trim()) {
      return;
    }
    await onConfirm(password);
    handleClose();
  };

  const isConfirmEnabled = confirmText === 'ELIMINAR TODO' && password.trim().length > 0;

  return (
    <div className="delete-all-modal-overlay">
      <div className="delete-all-modal">
        <button className="delete-all-modal-close" onClick={handleClose} disabled={isDeleting}>
          <X size={20} />
        </button>

        {step === 1 ? (
          <>
            <div className="delete-all-modal-header">
              <div className="delete-all-modal-icon danger">
                <AlertTriangle size={48} />
              </div>
              <h2 className="delete-all-modal-title">⚠️ Advertencia Crítica</h2>
            </div>

            <div className="delete-all-modal-body">
              <div className="delete-all-warning-box">
                <h3>Esta acción es IRREVERSIBLE</h3>
                <p>Estás a punto de eliminar TODOS los datos del sistema:</p>
                <ul className="delete-all-list">
                  <li>✗ Todos los ciclos escolares</li>
                  <li>✗ Todos los grupos</li>
                  <li>✗ Todos los estudiantes</li>
                  <li>✗ Todos los registros de asistencia</li>
                  <li>✗ Todas las faltas y justificaciones</li>
                  <li>✗ Todas las alertas</li>
                  <li>✗ Todas las tarjetas NFC</li>
                  <li>✗ <strong>TODOS los usuarios (incluyéndote a ti)</strong></li>
                </ul>
                <div className="delete-all-warning-critical">
                  <strong>⚠️ Tu sesión se cerrará automáticamente</strong> y el sistema quedará completamente vacío
                </div>
              </div>

              <div className="delete-all-warning-message">
                <AlertTriangle size={20} />
                <span>
                  <strong>NO HAY FORMA DE RECUPERAR</strong> estos datos una vez eliminados.
                  Asegúrate de haber creado un respaldo antes de continuar.
                </span>
              </div>
            </div>

            <div className="delete-all-modal-footer">
              <button 
                className="delete-all-btn delete-all-btn-secondary" 
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className="delete-all-btn delete-all-btn-danger" 
                onClick={handleContinue}
                disabled={isDeleting}
              >
                Entiendo, Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="delete-all-modal-header">
              <div className="delete-all-modal-icon danger">
                <Trash2 size={48} />
              </div>
              <h2 className="delete-all-modal-title">Confirmar Eliminación</h2>
            </div>

            <div className="delete-all-modal-body">
              <div className="delete-all-confirmation-box">
                <p className="delete-all-confirmation-text">
                  Para confirmar, escribe <strong>ELIMINAR TODO</strong> y proporciona tu contraseña:
                </p>

                <div className="delete-all-form-group">
                  <label>Escribe "ELIMINAR TODO"</label>
                  <input
                    type="text"
                    className="delete-all-input"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="ELIMINAR TODO"
                    disabled={isDeleting}
                    autoComplete="off"
                  />
                </div>

                <div className="delete-all-form-group">
                  <label>
                    <Lock size={16} /> Tu contraseña
                  </label>
                  <input
                    type="password"
                    className="delete-all-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    disabled={isDeleting}
                    autoComplete="current-password"
                  />
                </div>

                {confirmText && confirmText !== 'ELIMINAR TODO' && (
                  <div className="delete-all-error-message">
                    El texto no coincide. Debes escribir exactamente "ELIMINAR TODO"
                  </div>
                )}
              </div>
            </div>

            <div className="delete-all-modal-footer">
              <button 
                className="delete-all-btn delete-all-btn-secondary" 
                onClick={() => setStep(1)}
                disabled={isDeleting}
              >
                Atrás
              </button>
              <button 
                className="delete-all-btn delete-all-btn-danger" 
                onClick={handleConfirm}
                disabled={!isConfirmEnabled || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="delete-all-spinner"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Eliminar Todos los Datos
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAllDataModal;
