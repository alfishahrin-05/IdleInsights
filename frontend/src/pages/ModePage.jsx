import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const MODES = [
  { id: 'TASK_DECONSTRUCTOR', name: 'Task Deconstructor', emoji: '🧩', description: 'Break large tasks into manageable sub-tasks' },
  { id: 'DIGITAL_FRICTION', name: 'Digital Friction', emoji: '🚧', description: 'Add pauses to break doomscroll loops' },
  { id: 'DONE_OVER_PERFECT', name: 'Done-Over-Perfect', emoji: '✅', description: 'Time-box tasks to avoid perfectionism' },
  { id: 'NOVELTY_INJECTION', name: 'Novelty Injection', emoji: '🎮', description: 'Gamify boring tasks with XP and achievements' },
  { id: 'SINGLE_CONTEXT_LOCK', name: 'Single-Context Lock', emoji: '🔒', description: 'Pomodoro-style focus blocks' },
  { id: 'NEXT_ACTION_CLARIFIER', name: 'Next-Action Clarifier', emoji: '🎯', description: 'Define concrete next steps for vague tasks' }
];

const ModePage = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);

  useEffect(() => {
    fetchActiveTasks();
    fetchActiveMode();
  }, []);

  const fetchActiveTasks = async () => {
    try {
      const response = await API.get('/tasks');
      setTasks(response.data.filter(t => t.status === 'active'));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchActiveMode = async () => {
    try {
      const response = await API.get('/modes/active');
      setActiveMode(response.data);
    } catch (error) {
      console.error('Error fetching active mode:', error);
    }
  };

  const handleActivateMode = async () => {
    if (!selectedMode) {
      alert('Please select a mode');
      return;
    }

    // Modes with their own setup pages — navigate there to customize first
    const setupRoutes = {
      'DIGITAL_FRICTION': '/modes/digital-friction',
    };

    if (setupRoutes[selectedMode]) {
      navigate(setupRoutes[selectedMode]);
      return;
    }

    // Task Deconstructor requires task selection, then activates + navigates
    if (selectedMode === 'TASK_DECONSTRUCTOR' && !selectedTask) {
      alert('Please select a task for Task Deconstructor mode');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        activeMode: selectedMode,
        taskId: selectedMode === 'TASK_DECONSTRUCTOR' ? selectedTask : null
      };

      const response = await API.post('/modes/activate', payload);
      setActiveMode(response.data);
      
      const modeRoutes = {
        'TASK_DECONSTRUCTOR': `/modes/task-deconstructor/${response.data._id}`,
      };

      if (modeRoutes[selectedMode]) {
        navigate(modeRoutes[selectedMode]);
      } else {
        alert(`${MODES.find(m => m.id === selectedMode).name} activated! (Implementation coming soon)`);
      }
    } catch (error) {
      console.error('Error activating mode:', error);
      alert('Failed to activate mode');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMode = async () => {
    if (!activeMode) return;
    
    try {
      await API.delete(`/modes/${activeMode._id}`);
      setActiveMode(null);
      alert('Mode deactivated');
    } catch (error) {
      console.error('Error deactivating mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem' }}>Countermeasure Modes</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Select a specialized working mode to counteract specific procrastination patterns
        </p>

        {/* Active Mode Display */}
        {activeMode && (
          <div className="card" style={{ backgroundColor: 'var(--color-success)', marginBottom: '2rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {MODES.find(m => m.id === activeMode.activeMode)?.emoji} Active Mode: {MODES.find(m => m.id === activeMode.activeMode)?.name}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  {activeMode.taskId?.title && `Task: ${activeMode.taskId.title}`}
                </p>
              </div>
              <button onClick={handleDeactivateMode} className="btn" style={{ backgroundColor: '#ef4444' }}>
                Deactivate
              </button>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="card">
          <h2>Activate Mode (Testing)</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Select Mode
            </label>
            <select 
              value={selectedMode} 
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">-- Choose a Mode --</option>
              {MODES.map(mode => (
                <option key={mode.id} value={mode.id}>
                  {mode.emoji} {mode.name} - {mode.description}
                </option>
              ))}
            </select>
          </div>

          {/* Task Selection (only for Task Deconstructor) */}
          {selectedMode === 'TASK_DECONSTRUCTOR' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Select Task to Deconstruct
              </label>
              <select 
                value={selectedTask} 
                onChange={(e) => setSelectedTask(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="">-- Choose a Task --</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title} (Difficulty: {task.difficulty}/5)
                  </option>
                ))}
              </select>
              
              {tasks.length === 0 && (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                  No active tasks found. <Link to="/tasks">Create a task first</Link>
                </p>
              )}
            </div>
          )}

          <button 
            onClick={handleActivateMode} 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Activating...' : selectedMode === 'DIGITAL_FRICTION' ? 'Configure & Activate' : 'Activate Mode'}
          </button>
        </div>

        {/* Mode Cards */}
        <div style={{ marginTop: '2rem' }}>
          <h2>Available Modes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {MODES.map(mode => (
              <div 
                key={mode.id} 
                className="card" 
                style={{ 
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedMode === mode.id ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{mode.emoji}</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{mode.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {mode.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/dashboard" className="btn">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default ModePage;
