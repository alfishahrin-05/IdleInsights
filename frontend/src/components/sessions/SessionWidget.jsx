import { useState, useEffect } from 'react';
import { useSessionContext } from '../../contexts/SessionContext';
import SessionTimer from './SessionTimer';
import DistractionModal from './DistractionModal';
import FocusPrompt from './FocusPrompt';
import SessionSummary from './SessionSummary';
import SubTaskCard from '../modes/SubTaskCard';
import FrictionPauseModal from '../modes/FrictionPauseModal';
import FloatingFrictionWidget from '../modes/FloatingFrictionWidget';
import { useFocusDetection } from '../../hooks/useFocusDetection';

const SessionWidget = () => {
    const { 
        activeSession, 
        elapsedSeconds, 
        isActive, 
        isPaused,
        pauseSession, 
        resumeSession, 
        endSession,
        clearSession,
        showDistractionPrompt,
        setShowDistractionPrompt,
        activeMode,
        activateExistingMode,
        // Digital Friction
        showFrictionPause,
        showFrictionWidget,
        setShowFrictionWidget,
        frictionWidgetCategory,
        startDistractionTracking,
        endDistractionTracking,
        continueBrowsing,
        getCurrentFrictionPauseDuration
    } = useSessionContext();

    const [showDistractionModal, setShowDistractionModal] = useState(false);
    const [showFocusPrompt, setShowFocusPrompt] = useState(false);
    const [awayDuration, setAwayDuration] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [activatingMode, setActivatingMode] = useState(false);

    // Handle focus detection
    useFocusDetection((duration) => {
        setAwayDuration(duration);
        setShowFocusPrompt(true);
    });

    // Watch for check-in distraction prompt from notification
    useEffect(() => {
        if (showDistractionPrompt) {
            setShowDistractionModal(true);
            setShowDistractionPrompt(false);
        }
    }, [showDistractionPrompt, setShowDistractionPrompt]);

    if (!activeSession) return null;

    const handleEndSession = async () => {
        try {
            const summary = await endSession();
            setSessionSummary(summary);
            setShowSummary(true);
        } catch (error) {
            alert('Failed to end session');
        }
    };

    const handleActivateMode = async () => {
        if (!activeSession?.intendedTaskId?._id) return;
        
        setActivatingMode(true);
        try {
            await activateExistingMode(activeSession.intendedTaskId._id);
        } catch (error) {
            console.error('Failed to activate mode:', error);
            alert('Failed to activate Task Deconstructor mode. Make sure the task has sub-tasks defined.');
        } finally {
            setActivatingMode(false);
        }
    };

    // Check if task has sub-task template but mode not active
    const hasSubTaskTemplate = activeSession?.intendedTaskId?.subTaskTemplate?.length > 0;
    const canActivateMode = hasSubTaskTemplate && !activeMode;

    return (
        <>
            {/* Sub-Task Card (if mode active) */}
            <SubTaskCard key={activeMode?._id || 'no-mode'} />

            {/* Digital Friction Pause Modal */}
            <FrictionPauseModal
                isOpen={showFrictionPause}
                duration={getCurrentFrictionPauseDuration?.() || 10}
                onReturnToTask={endDistractionTracking}
                onContinueBrowsing={continueBrowsing}
                taskName={activeSession?.intendedTaskId?.title}
            />

            {/* Floating Session Widget */}
            <div 
                className="session-widget"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'var(--color-card-bg)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '300px',
                    maxWidth: '400px'
                }}
            >
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    🎯 Working on:
                </div>
                <div style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {activeSession.intendedTaskId?.title || 'Unknown Task'}
                </div>

                <SessionTimer elapsedSeconds={elapsedSeconds} />

                {isPaused && (
                    <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.5rem', 
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        color: '#f59e0b'
                    }}>
                        ⏸️ Session Paused
                    </div>
                )}

                {/* Activate Mode Button (if task has template but mode not active) */}
                {canActivateMode && (
                    <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '8px',
                        border: '1px dashed var(--color-primary)'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            🧩 This task has sub-tasks defined
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleActivateMode}
                            disabled={activatingMode}
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                        >
                            {activatingMode ? 'Activating...' : 'Activate Task Deconstructor'}
                        </button>
                    </div>
                )}

                <div style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    gap: '0.5rem', 
                    flexWrap: 'wrap' 
                }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowDistractionModal(true)}
                        style={{ flex: '1 1 auto', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        disabled={isPaused}
                    >
                        🔴 Got Distracted
                    </button>

                    {isActive ? (
                        <button
                            className="btn"
                            onClick={pauseSession}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                            ⏸️ Pause
                        </button>
                    ) : (
                        <button
                            className="btn"
                            onClick={resumeSession}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                            ▶️ Resume
                        </button>
                    )}

                    <button
                        className="btn"
                        onClick={handleEndSession}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                        ⏹️ End
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showDistractionModal && (
                <DistractionModal
                    onClose={() => setShowDistractionModal(false)}
                    elapsedSinceLastEvent={0}
                />
            )}

            {showFocusPrompt && (
                <FocusPrompt
                    awayDuration={awayDuration}
                    onClose={() => setShowFocusPrompt(false)}
                />
            )}

            {showSummary && sessionSummary && (
                <SessionSummary
                    session={sessionSummary}
                    onClose={() => {
                        setShowSummary(false);
                        clearSession();
                    }}
                />
            )}

            {showFrictionWidget && (
                <FloatingFrictionWidget
                    category={frictionWidgetCategory}
                    onStartTracking={() => startDistractionTracking(frictionWidgetCategory)}
                    onDismiss={() => setShowFrictionWidget(false)}
                />
            )}
        </>
    );
};

export default SessionWidget;
