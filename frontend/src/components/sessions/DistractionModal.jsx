import { useState } from 'react';
import { useSessionContext } from '../../contexts/SessionContext';

const CATEGORIES = [
    { value: 'social', label: '📱 Social Media', emoji: '📱' },
    { value: 'video', label: '📺 Video/Streaming', emoji: '📺' },
    { value: 'gaming', label: '🎮 Gaming', emoji: '🎮' },
    { value: 'browsing', label: '🌐 Browsing', emoji: '🌐' },
    { value: 'messaging', label: '💬 Messaging', emoji: '💬' },
    { value: 'other', label: '⚙️ Other', emoji: '⚙️' }
];

const DistractionModal = ({ onClose, elapsedSinceLastEvent = 0 }) => {
    const { logDistraction, activeMode } = useSessionContext();
    const [formData, setFormData] = useState({
        activityCategory: '',
        durationMinutes: Math.max(1, Math.floor(elapsedSinceLastEvent / 60)),
        activityDetail: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const isDigitalFrictionActive = activeMode?.activeMode === 'DIGITAL_FRICTION';
    const enabledCategories = activeMode?.settings?.enabledCategories || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.activityCategory) {
            alert('Please select an activity category');
            return;
        }

        try {
            setSubmitting(true);
            
            // Always log the distraction first
            await logDistraction(formData);
            onClose();
            // If Digital Friction is active and category is monitored,
            // the FloatingFrictionWidget will appear automatically
        } catch (error) {
            console.error('Distraction log error:', error);
            alert('Oops! Something went wrong logging that distraction. Try again? 🤷');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCategorySelect = (category) => {
        setFormData({ ...formData, activityCategory: category });
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
            onClick={onClose}
        >
            <div 
                className="card"
                style={{ 
                    maxWidth: '500px', 
                    width: '100%',
                    animation: 'fadeIn 0.2s'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '1rem' }}>What distracted you?</h2>

                <form onSubmit={handleSubmit}>
                    {/* Category Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                            Activity Type:
                        </label>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.5rem' 
                        }}>
                            {CATEGORIES.map(cat => {
                                const isMonitored = isDigitalFrictionActive && enabledCategories.includes(cat.value);
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => handleCategorySelect(cat.value)}
                                        style={{
                                            padding: '0.75rem',
                                            border: formData.activityCategory === cat.value 
                                                ? '2px solid var(--color-primary)' 
                                                : '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            background: formData.activityCategory === cat.value 
                                                ? 'rgba(99, 102, 241, 0.1)' 
                                                : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                                            {cat.emoji}
                                        </div>
                                        {cat.label.replace(cat.emoji, '').trim()}
                                        {isMonitored && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#3b82f6',
                                                border: '2px solid white',
                                                boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
                                            }} title="Monitored by Digital Friction Mode" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Duration */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            Duration (minutes):
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="input-field"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                durationMinutes: parseInt(e.target.value) || 1 
                            })}
                            required
                        />
                    </div>

                    {/* Optional Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Details (optional):
                        </label>
                        <textarea
                            className="input-field"
                            rows="2"
                            placeholder="e.g., Watched cat videos on YouTube"
                            value={formData.activityDetail}
                            onChange={(e) => setFormData({ ...formData, activityDetail: e.target.value })}
                        />
                    </div>

                    {/* Digital Friction Info */}
                    {isDigitalFrictionActive && enabledCategories.includes(formData.activityCategory) && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-text)'
                        }}>
                            <strong>🚧 Digital Friction Active:</strong> After logging, you'll see an option to track your 
                            current browsing with mindful pauses to help you return to your task.
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || !formData.activityCategory}
                            style={{ flex: 1 }}
                        >
                            {submitting ? 'Logging...' : 'Log & Continue Session'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DistractionModal;
