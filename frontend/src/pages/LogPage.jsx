import { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const LogPage = () => {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({
        intendedTaskId: '',
        durationMinutes: 30,
        activityCategory: 'social',
        activityDetail: ''
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await API.get('/tasks?status=active');
                setTasks(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.intendedTaskId) {
                return alert('Please select the task you avoided!');
            }

            const res = await API.post('/logs', formData);
            // Pass the new analytics to dashboard via state or just navigate and let dashboard refetch
            // For immediate feedback, we could show a modal, but navigation is simpler for MVP
            navigate('/dashboard', { state: { newLog: res.data } });
        } catch (error) {
            alert(error.response?.data?.message || 'Error logging event');
        }
    };

    const categories = [
        { value: 'social', label: 'Social Media' },
        { value: 'video', label: 'Video / Streaming' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'browsing', label: 'Aimless Browsing' },
        { value: 'messaging', label: 'Messaging / Chat' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <div className="page-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ textAlign: 'center' }}>
                <h1>Confess Your Avoidance</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>"What did you do instead?"</p>
            </header>

            <div className="card">
                {loading ? <p>Loading tasks...</p> : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>I intended to do:</label>
                            <select
                                className="input-field"
                                value={formData.intendedTaskId}
                                onChange={e => setFormData({ ...formData, intendedTaskId: e.target.value })}
                                required
                            >
                                <option value="">-- Select a Task --</option>
                                {tasks.map(task => (
                                    <option key={task._id} value={task._id}>{task.title} (Diff: {task.difficulty})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>But instead I did:</label>
                            <select
                                className="input-field"
                                value={formData.activityCategory}
                                onChange={e => setFormData({ ...formData, activityCategory: e.target.value })}
                            >
                                {categories.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>For how long? (minutes)</label>
                            <input
                                type="number"
                                min="1"
                                className="input-field"
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Details (optional)</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                placeholder="e.g. Watched cat videos on YouTube"
                                value={formData.activityDetail}
                                onChange={e => setFormData({ ...formData, activityDetail: e.target.value })}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Submit Confession & Update PVI
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LogPage;
