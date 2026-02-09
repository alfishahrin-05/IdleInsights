import { useState, useEffect } from 'react';
import { PenSquare } from 'lucide-react';
import QuickLogModal from '../logs/QuickLogModal';
import { useQuickLog } from '../../App';

const FloatingQuickLogButton = () => {
    const [showModal, setShowModal] = useState(false);
    const quickLogContext = useQuickLog();

    // Listen for keyboard shortcut trigger from App
    useEffect(() => {
        if (quickLogContext?.showQuickLog) {
            setShowModal(true);
            quickLogContext.setShowQuickLog(false);
        }
    }, [quickLogContext?.showQuickLog]);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                title="Quick Log Distraction (Ctrl+L)"
            >
                <PenSquare size={24} />
            </button>

            {showModal && (
                <QuickLogModal 
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        // Optional: show a toast notification or trigger analytics refresh
                        console.log('Log submitted successfully');
                    }}
                />
            )}
        </>
    );
};

export default FloatingQuickLogButton;
