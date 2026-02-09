import { useState } from 'react';
import { useSessionContext } from '../../contexts/SessionContext';

const FocusPrompt = ({ awayDuration, onClose }) => {
    const { recordFocusRegained } = useSessionContext();
    const [submitting, setSubmitting] = useState(false);
    const [showGuesstimate, setShowGuesstimate] = useState(false);
    const [distractedMinutes, setDistractedMinutes] = useState(Math.floor(awayDuration / 2));

    const handleFullDistraction = async () => {
        try {
            setSubmitting(true);
            await recordFocusRegained('distraction', awayDuration);
            onClose();
        } catch (error) {
            alert('Failed to record focus status');
            setSubmitting(false);
        }
    };

    const handleWorkingElsewhere = async () => {
        try {
            setSubmitting(true);
            await recordFocusRegained('working_elsewhere', 0);
            onClose();
        } catch (error) {
            alert('Failed to record focus status');
            setSubmitting(false);
        }
    };

    const handleSkip = async () => {
        try {
            setSubmitting(true);
            await recordFocusRegained('ignored', 0);
            onClose();
        } catch (error) {
            alert('Failed to record focus status');
            setSubmitting(false);
        }
    };

    const handleGuesstimate = async () => {
        try {
            setSubmitting(true);
            
            if (distractedMinutes > 0 && distractedMinutes <= awayDuration) {
                // Log partial distraction
                await recordFocusRegained('partial_distraction', distractedMinutes);
            } else {
                // All work
                await recordFocusRegained('working_elsewhere', 0);
            }
            
            onClose();
        } catch (error) {
            alert('Failed to record focus status');
            setSubmitting(false);
        }
    };

    return (
        <div 
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '1rem'
            }}
        >
            <div 
                className="card"
                style={{ 
                    maxWidth: '450px', 
                    width: '100%',
                    textAlign: 'center',
                    animation: 'fadeIn 0.2s'
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                <h2 style={{ marginBottom: '0.5rem' }}>Welcome back!</h2>
                <p style={{ 
                    fontSize: '1.2rem', 
                    marginBottom: '2rem',
                    color: 'var(--color-text-muted)' 
                }}>
                    You were away for <strong style={{ color: 'var(--color-primary)' }}>
                        {awayDuration} minute{awayDuration !== 1 ? 's' : ''}
                    </strong>
                </p>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    What were you doing?
                </div>

                {!showGuesstimate ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleFullDistraction}
                            disabled={submitting}
                            style={{ padding: '1rem', fontSize: '1rem' }}
                        >
                            📱 All Distracted (log all {awayDuration} min)
                        </button>
                        
                        <button
                            className="btn"
                            onClick={handleWorkingElsewhere}
                            disabled={submitting}
                            style={{ padding: '1rem', fontSize: '1rem' }}
                        >
                            💼 All Working (count as focused)
                        </button>

                        <button
                            className="btn"
                            onClick={() => setShowGuesstimate(true)}
                            disabled={submitting}
                            style={{ padding: '1rem', fontSize: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}
                        >
                            ⚖️ Mixed (guesstimate)
                        </button>
                        
                        <button
                            className="btn"
                            onClick={handleSkip}
                            disabled={submitting}
                            style={{ padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}
                        >
                            Skip (assume all work)
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ 
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px'
                        }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                                How many minutes were you distracted?
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={awayDuration}
                                className="input-field"
                                value={distractedMinutes}
                                onChange={(e) => setDistractedMinutes(Math.min(awayDuration, Math.max(0, parseInt(e.target.value) || 0)))}
                                style={{ marginBottom: '0.75rem' }}
                            />
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <div>Distracted: <strong style={{ color: '#ef4444' }}>{distractedMinutes} min</strong></div>
                                <div>Working: <strong style={{ color: '#10b981' }}>{awayDuration - distractedMinutes} min</strong></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleGuesstimate}
                                disabled={submitting}
                                style={{ flex: 1 }}
                            >
                                Submit
                            </button>
                            <button
                                className="btn"
                                onClick={() => setShowGuesstimate(false)}
                                disabled={submitting}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusPrompt;
