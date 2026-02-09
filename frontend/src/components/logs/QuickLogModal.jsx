import { useState, useEffect } from 'react';
import API from '../../services/api';
import { X } from 'lucide-react';

const CATEGORIES = [
    { value: 'social', label: '📱 Social Media', emoji: '📱' },
    { value: 'video', label: '📺 Video/Streaming', emoji: '📺' },
    { value: 'gaming', label: '🎮 Gaming', emoji: '🎮' },
    { value: 'browsing', label: '🌐 Browsing', emoji: '🌐' },
    { value: 'messaging', label: '💬 Messaging', emoji: '💬' },
    { value: 'other', label: '⚙️ Other', emoji: '⚙️' }
];

const DURATION_PRESETS = [
    { value: 5, label: '5m' },
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 120, label: '2h' }
];

const QuickLogModal = ({ onClose, onSuccess }) => {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({
        intendedTaskId: '',
        durationMinutes: 30,
        activityCategory: '',
        activityDetail: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showCustomDuration, setShowCustomDuration] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await API.get('/tasks?status=active');
                setTasks(res.data);
                
                // Smart default: use last logged task from localStorage
                const lastTaskId = localStorage.getItem('lastLoggedTaskId');
                if (lastTaskId && res.data.some(t => t._id === lastTaskId)) {
                    setFormData(prev => ({ ...prev, intendedTaskId: lastTaskId }));
                } else if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, intendedTaskId: res.data[0]._id }));
                }
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
        };
        fetchTasks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.intendedTaskId) {
            alert('Please select a task');
            return;
        }

        if (!formData.activityCategory) {
            alert('Please select an activity category');
            return;
        }

        try {
            setSubmitting(true);
            await API.post('/logs', formData);
            
            // Save last used task for smart defaults
            localStorage.setItem('lastLoggedTaskId', formData.intendedTaskId);
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert('Failed to log distraction');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCategorySelect = (category) => {
        setFormData({ ...formData, activityCategory: category });
    };

    const handleDurationPreset = (minutes) => {
        setFormData({ ...formData, durationMinutes: minutes });
        setShowCustomDuration(false);
    };

    const handleCustomDuration = () => {
        setShowCustomDuration(true);
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
                    animation: 'fadeIn 0.2s',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.6,
                        padding: '0.25rem'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '1.5rem' }}>Quick Distraction Log</h2>

                <form onSubmit={handleSubmit}>
                    {/* Task Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            I was supposed to:
                        </label>
                        <select
                            value={formData.intendedTaskId}
                            onChange={(e) => setFormData({ ...formData, intendedTaskId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #475569',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#f8fafc',
                                fontSize: '1rem'
                            }}
                            required
                        >
                            <option value="">Select a task...</option>
                            {tasks.map(task => (
                                <option key={task._id} value={task._id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                            But I did:
                        </label>
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.75rem'
                        }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat.value)}
                                    style={{
                                        padding: '1rem',
                                        border: formData.activityCategory === cat.value 
                                            ? '2px solid #3b82f6' 
                                            : '2px solid #475569',
                                        borderRadius: '8px',
                                        background: formData.activityCategory === cat.value 
                                            ? 'rgba(59, 130, 246, 0.15)' 
                                            : 'rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        color: 'inherit'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{cat.emoji}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#f8fafc' }}>
                                        {cat.label.replace(/^.+ /, '')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                            For how long:
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {DURATION_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleDurationPreset(preset.value)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: formData.durationMinutes === preset.value 
                                            ? '2px solid #3b82f6' 
                                            : '2px solid #475569',
                                        borderRadius: '6px',
                                        background: formData.durationMinutes === preset.value 
                                            ? 'rgba(59, 130, 246, 0.15)' 
                                            : 'rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        color: '#f8fafc'
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={handleCustomDuration}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '2px solid #475569',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: '#94a3b8'
                                }}
                            >
                                Custom
                            </button>
                        </div>
                        {showCustomDuration && (
                            <input
                                type="number"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    durationMinutes: parseInt(e.target.value) || 0 
                                })}
                                min="1"
                                style={{
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid #475569',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#f8fafc'
                                }}
                                placeholder="Enter minutes..."
                            />
                        )}
                    </div>

                    {/* Optional Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            Details (optional):
                        </label>
                        <textarea
                            value={formData.activityDetail}
                            onChange={(e) => setFormData({ ...formData, activityDetail: e.target.value })}
                            placeholder="What specifically distracted you?"
                            rows="2"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #475569',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#f8fafc',
                                fontSize: '0.9rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !formData.activityCategory}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: !formData.activityCategory ? '#9ca3af' : '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: !formData.activityCategory ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {submitting ? 'Logging...' : 'Quick Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuickLogModal;
