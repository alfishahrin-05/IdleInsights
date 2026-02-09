/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
export const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const SessionTimer = ({ elapsedSeconds, label = 'Elapsed' }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {label}:
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatTime(elapsedSeconds)}
            </span>
        </div>
    );
};

export default SessionTimer;
