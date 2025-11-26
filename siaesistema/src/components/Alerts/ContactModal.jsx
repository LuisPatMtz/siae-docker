// src/components/Alerts/ContactModal.jsx
import React from 'react';
import { X, Mail, User, Hash, Users } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, student }) => {
    if (!isOpen || !student) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header" style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '2px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 className="modal-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                        Información del Estudiante
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-action"
                        style={{ padding: '0.5rem' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Nombre */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <User size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Nombre Completo
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {student.nombre}
                                </div>
                            </div>
                        </div>

                        {/* Matrícula */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Hash size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Matrícula
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {student.matricula}
                                </div>
                            </div>
                        </div>

                        {/* Grupo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #34d399)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Grupo
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {student.grupo}
                                </div>
                            </div>
                        </div>

                        {/* Correo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Correo Electrónico
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {student.correo || 'No registrado'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{
                    padding: '1.5rem 2rem',
                    borderTop: '2px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
