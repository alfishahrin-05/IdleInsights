import { useNavigate } from 'react-router-dom';

const SessionSummary = ({ session, onClose }) => {
    const navigate = useNavigate();

    if (!session || !session.summary) return null;

    const { summary, intendedTaskId } = session;

    const handleViewDashboard = () => {
        onClose();
        navigate('/dashboard');
    };

    const getEfficiencyColor = (score) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // yellow
        return '#ef4444'; // red
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
                    maxWidth: '500px', 
                    width: '100%',
                    animation: 'fadeIn 0.2s'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Session Complete!</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {intendedTaskId?.title || 'Task'}
                    </p>
                </div>

                {/* Main Stats */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '1rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {summary.totalMinutes}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Total Minutes
                        </div>
                    </div>

                    <div style={{ 
                        textAlign: 'center', 
                        padding: '1rem',
                        background: `rgba(${summary.efficiencyScore >= 80 ? '16, 185, 129' : summary.efficiencyScore >= 60 ? '245, 158, 11' : '239, 68, 68'}, 0.1)`,
                        borderRadius: '8px'
                    }}>
                        <div style={{ 
                            fontSize: '2rem', 
                            fontWeight: 'bold',
                            color: getEfficiencyColor(summary.efficiencyScore)
                        }}>
                            {summary.efficiencyScore}%
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Efficiency
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Time Breakdown:</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '6px'
                        }}>
                            <span>✅ Focused Time:</span>
                            <strong>{summary.focusedMinutes} min</strong>
                        </div>

                        {summary.distractedMinutes > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '6px'
                            }}>
                                <span>❌ Distracted Time:</span>
                                <strong>{summary.distractedMinutes} min</strong>
                            </div>
                        )}

                        {summary.pausedMinutes > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '6px'
                            }}>
                                <span>⏸️ Paused Time:</span>
                                <strong>{summary.pausedMinutes} min</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Stats */}
                {(summary.distractionCount > 0 || summary.focusLossCount > 0 || (summary.checkInsCompleted + summary.checkInsMissed) > 0) && (
                    <div style={{ 
                        marginBottom: '2rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        {summary.distractionCount > 0 && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                🔴 Distractions logged: <strong>{summary.distractionCount}</strong>
                            </div>
                        )}
                        {summary.focusLossCount > 0 && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                👀 Times lost focus: <strong>{summary.focusLossCount}</strong>
                            </div>
                        )}
                        {(summary.checkInsCompleted + summary.checkInsMissed) > 0 && (
                            <div>
                                ✅ Check-ins: <strong>{summary.checkInsCompleted}/{summary.checkInsCompleted + summary.checkInsMissed}</strong> ({summary.checkInCompletionRate}%)
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleViewDashboard}
                        style={{ flex: 1 }}
                    >
                        View Dashboard
                    </button>
                    <button
                        className="btn"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                {/* Encouragement Message */}
                <div style={{ 
                    marginTop: '1rem', 
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic'
                }}>
                    {summary.efficiencyScore >= 80 ? '🌟 Great focus!' :
                     summary.efficiencyScore >= 60 ? '💪 Good effort!' :
                     '📈 Keep improving!'}
                </div>
            </div>
        </div>
    );
};

export default SessionSummary;
