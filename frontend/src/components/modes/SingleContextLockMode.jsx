import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Play, Pause, RotateCcw, AlertCircle, Trash2, Plus, Flame } from 'lucide-react';

const SingleContextLockMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalPenaltyTime, setTotalPenaltyTime] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const [laterList, setLaterList] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);

  const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

  useEffect(() => {
    fetchTasks();
    if (modeId) {
      fetchModeDetails();
    }
  }, [modeId]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const fetchTasks = async () => {
    try {
      const response = await API.get('/tasks');
      setTasks(response.data.filter(t => t.status === 'active'));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchModeDetails = async () => {
    try {
      const response = await API.get(`/modes/${modeId}`);
      setMode(response.data);
      if (response.data.contextLock?.lockedTaskId) {
        setSelectedTaskId(response.data.contextLock.lockedTaskId);
      }
      setTotalPenaltyTime(response.data.contextLock?.totalPenaltyTime || 0);
      setSwitchCount(response.data.contextLock?.switchCount || 0);
      setFocusStreak(response.data.contextLock?.focusStreak || 0);
      setLaterList(response.data.contextLock?.laterList || []);
    } catch (error) {
      console.error('Error fetching mode:', error);
    }
  };

  const handleActivateMode = async () => {
    if (!selectedTaskId) {
      alert('Please select a task');
      return;
    }

    try {
      const payload = {
        activeMode: 'SINGLE_CONTEXT_LOCK',
        taskId: selectedTaskId
      };
      const response = await API.post('/modes/activate', payload);
      setMode(response.data);
      navigate(`/modes/single-context-lock/${response.data._id}`);
      setIsRunning(true);
    } catch (error) {
      console.error('Error activating mode:', error);
      alert('Failed to activate mode');
    }
  };

  const handleContextSwitch = () => {
    setShowSwitchWarning(true);
  };

  const confirmContextSwitch = () => {
    const penaltyMinutes = 5;
    const newPenalty = totalPenaltyTime + (penaltyMinutes * 60);
    setTotalPenaltyTime(newPenalty);
    setSwitchCount(prev => prev + 1);
    setFocusStreak(0); // Reset streak on context switch
    setShowSwitchWarning(false);
    setElapsedSeconds(0); // Reset timer
  };

  const handleCompletePomodoro = () => {
    if (elapsedSeconds >= POMODORO_DURATION) {
      const newStreak = focusStreak + 1;
      setFocusStreak(newStreak);
      setElapsedSeconds(0);
      
      if (newStreak === 4) {
        alert('🏆 Deep Work Session! You\'ve completed 4 consecutive Pomodoros! Take an extended break.');
        setFocusStreak(0);
      } else {
        alert(`✓ Pomodoro complete! Streak: ${newStreak}/4`);
      }
    }
  };

  const addToLaterList = () => {
    if (newItem.trim()) {
      setLaterList([...laterList, { id: Date.now(), text: newItem }]);
      setNewItem('');
    }
  };

  const removeFromLaterList = (id) => {
    setLaterList(laterList.filter(item => item.id !== id));
  };

  const handleDeactivateMode = async () => {
    if (!mode) return;
    
    try {
      await API.delete(`/modes/${mode._id}`);
      setMode(null);
      setIsRunning(false);
      navigate('/modes');
      alert('Mode deactivated');
    } catch (error) {
      console.error('Error deactivating mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup view
  if (!modeId) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Eliminate context switching with focused 25-minute Pomodoro blocks
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Setup Your Focus Session</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Task to Lock
              </label>
              <select 
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Select a task --</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <strong>How It Works:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <li>Work in 25-minute Pomodoro blocks (locked to single task)</li>
                <li>Distract yourself? +5 min penalty added + streak resets</li>
                <li>Complete ideas can go in "Later List" without breaking focus</li>
                <li>4 consecutive Pomodoros = "Deep Work Session" badge</li>
                <li>Brain reset exercises help recovery after context switches</li>
              </ul>
            </div>

            <button 
              onClick={handleActivateMode}
              disabled={!selectedTaskId}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: selectedTaskId ? '#6366f1' : '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: selectedTaskId ? 'pointer' : 'not-allowed'
              }}
            >
              Activate & Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view
  return (
    <div className="page-container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
      {/* Main Content */}
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Active • {selectedTaskId && tasks.find(t => t._id === selectedTaskId)?.title}
            </p>
          </div>
          <button 
            onClick={handleDeactivateMode}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            End Session
          </button>
        </div>

        {/* Timer Display */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              color: '#6366f1'
            }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'rgba(148, 163, 184, 0.1)',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                width: `${(elapsedSeconds / POMODORO_DURATION) * 100}%`,
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              25-Minute Pomodoro Block • {Math.round((elapsedSeconds / POMODORO_DURATION) * 100)}%
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isRunning ? '#ef4444' : '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={18} /> Resume
                  </>
                )}
              </button>
              {elapsedSeconds >= POMODORO_DURATION && (
                <button
                  onClick={handleCompletePomodoro}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✓ Complete Pomodoro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Session Stats</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: focusStreak > 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(148, 163, 184, 0.05)',
              border: focusStreak > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(148, 163, 184, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Focus Streak
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: focusStreak > 0 ? '#f59e0b' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {focusStreak} {focusStreak > 0 && <Flame size={24} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                {focusStreak >= 4 ? '🏆 Deep Work!' : `${4 - focusStreak} to Deep Work`}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Context Switches
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: switchCount > 0 ? '#ef4444' : '#10b981' }}>
                {switchCount}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Penalty Time
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {Math.floor(totalPenaltyTime / 60)}m
              </div>
            </div>
          </div>
        </div>

        {/* Context Switch Section */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Brain Reset Exercise</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Did you switch contexts? Follow this 2-minute breathing exercise to refocus:
          </p>
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', marginBottom: '1rem' }}>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Sit upright with feet on floor</li>
              <li>Inhale for 4 counts, hold for 4 counts</li>
              <li>Exhale for 4 counts, hold for 4 counts</li>
              <li>Repeat 8 times (about 2 minutes)</li>
            </ol>
          </div>
          <button 
            onClick={handleContextSwitch}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            I Switched Context (Record + Add Penalty)
          </button>
        </div>
      </div>

      {/* Later List Sidebar */}
      <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>📝 Later List</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Jot down distracting thoughts without breaking focus
        </p>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToLaterList()}
            placeholder="Add item..."
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '0.85rem'
            }}
          />
          <button
            onClick={addToLaterList}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {laterList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {laterList.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.85rem', flex: 1, wordBreak: 'break-word' }}>
                  {item.text}
                </span>
                <button
                  onClick={() => removeFromLaterList(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
            No items yet. Stay focused!
          </p>
        )}
      </div>

      {/* Context Switch Warning Modal */}
      {showSwitchWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            border: '3px solid #ef4444',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Context Switch Detected!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Switching tasks will reset your focus block and add a 5-minute penalty. Your focus streak will also reset.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#f59e0b', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '6px' }}>
              💡 Pro tip: Add your distraction to the "Later List" instead to keep focus!
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowSwitchWarning(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmContextSwitch}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleContextLockMode;

  const handleDeactivateMode = async () => {
    if (!mode) return;
    
    try {
      await API.delete(`/modes/${mode._id}`);
      setMode(null);
      setIsRunning(false);
      navigate('/modes');
      alert('Mode deactivated');
    } catch (error) {
      console.error('Error deactivating mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup view
  if (!modeId) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Eliminate context switching with focused 25-minute Pomodoro blocks
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Setup Your Focus Session</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Task to Lock
              </label>
              <select 
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Select a task --</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <strong>How It Works:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <li>Work in 25-minute Pomodoro blocks (locked to single task)</li>
                <li>Distract yourself? +5 min penalty added + streak resets</li>
                <li>Complete ideas can go in "Later List" without breaking focus</li>
                <li>4 consecutive Pomodoros = "Deep Work Session" badge</li>
                <li>Brain reset exercises help recovery after context switches</li>
              </ul>
            </div>

            <button 
              onClick={handleActivateMode}
              disabled={!selectedTaskId}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: selectedTaskId ? '#6366f1' : '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: selectedTaskId ? 'pointer' : 'not-allowed'
              }}
            >
              Activate & Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view
  return (
    <div className="page-container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
      {/* Main Content */}
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Active • {selectedTaskId && tasks.find(t => t._id === selectedTaskId)?.title}
            </p>
          </div>
          <button 
            onClick={handleDeactivateMode}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            End Session
          </button>
        </div>

        {/* Timer Display */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              color: '#6366f1'
            }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'rgba(148, 163, 184, 0.1)',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                width: `${(elapsedSeconds / POMODORO_DURATION) * 100}%`,
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              25-Minute Pomodoro Block • {Math.round((elapsedSeconds / POMODORO_DURATION) * 100)}%
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isRunning ? '#ef4444' : '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={18} /> Resume
                  </>
                )}
              </button>
              {elapsedSeconds >= POMODORO_DURATION && (
                <button
                  onClick={handleCompletePomodoro}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✓ Complete Pomodoro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Session Stats</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: focusStreak > 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(148, 163, 184, 0.05)',
              border: focusStreak > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(148, 163, 184, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Focus Streak
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: focusStreak > 0 ? '#f59e0b' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {focusStreak} {focusStreak > 0 && <Flame size={24} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                {focusStreak >= 4 ? '🏆 Deep Work!' : `${4 - focusStreak} to Deep Work`}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Context Switches
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: switchCount > 0 ? '#ef4444' : '#10b981' }}>
                {switchCount}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Penalty Time
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {Math.floor(totalPenaltyTime / 60)}m
              </div>
            </div>
          </div>
        </div>

        {/* Context Switch Section */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Brain Reset Exercise</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Did you switch contexts? Follow this 2-minute breathing exercise to refocus:
          </p>
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', marginBottom: '1rem' }}>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Sit upright with feet on floor</li>
              <li>Inhale for 4 counts, hold for 4 counts</li>
              <li>Exhale for 4 counts, hold for 4 counts</li>
              <li>Repeat 8 times (about 2 minutes)</li>
            </ol>
          </div>
          <button 
            onClick={handleContextSwitch}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            I Switched Context (Record + Add Penalty)
          </button>
        </div>
      </div>

      {/* Later List Sidebar */}
      <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>📝 Later List</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Jot down distracting thoughts without breaking focus
        </p>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToLaterList()}
            placeholder="Add item..."
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '0.85rem'
            }}
          />
          <button
            onClick={addToLaterList}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {laterList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {laterList.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.85rem', flex: 1, wordBreak: 'break-word' }}>
                  {item.text}
                </span>
                <button
                  onClick={() => removeFromLaterList(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
            No items yet. Stay focused!
          </p>
        )}
      </div>

      {/* Context Switch Warning Modal */}
      {showSwitchWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            border: '3px solid #ef4444',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Context Switch Detected!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Switching tasks will reset your focus block and add a 5-minute penalty. Your focus streak will also reset.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#f59e0b', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '6px' }}>
              💡 Pro tip: Add your distraction to the "Later List" instead to keep focus!
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowSwitchWarning(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmContextSwitch}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleContextLockMode;

    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Eliminate context switching with focused Pomodoro-style work blocks
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Setup Your Focus Session</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Task to Lock
              </label>
              <select 
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Select a task --</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <strong>How It Works:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <li>Context lock prevents you from switching tasks</li>
                <li>Each switch adds 5-minute penalties to your session</li>
                <li>Penalties escalate if you keep switching</li>
                <li>Brain reset exercises help you recover focus</li>
              </ul>
            </div>

            <button 
              onClick={handleActivateMode}
              disabled={!selectedTaskId}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: selectedTaskId ? '#6366f1' : '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: selectedTaskId ? 'pointer' : 'not-allowed'
              }}
            >
              Activate & Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view
  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Single-Context Lock Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Active • {selectedTaskId && tasks.find(t => t._id === selectedTaskId)?.title}
            </p>
          </div>
          <button 
            onClick={handleDeactivateMode}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            End Session
          </button>
        </div>

        {/* Timer Display */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              color: '#6366f1'
            }}>
              {formatTime(elapsedSeconds)}
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Session Time Elapsed
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isRunning ? '#ef4444' : '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={18} /> Resume
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setElapsedSeconds(0);
                  setTotalPenaltyTime(0);
                  setSwitchCount(0);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RotateCcw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Session Stats</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Context Switches
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: switchCount > 0 ? '#ef4444' : '#10b981' }}>
                {switchCount}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Penalty Time
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {Math.floor(totalPenaltyTime / 60)}m
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Brain Reset Exercise</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            If you detect a context switch, do this 2-minute breathing exercise to refocus:
          </p>
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Sit upright with feet on floor</li>
              <li>Inhale for 4 counts, hold for 4 counts</li>
              <li>Exhale for 4 counts, hold for 4 counts</li>
              <li>Repeat 8 times (about 2 minutes)</li>
            </ol>
          </div>
          <button 
            onClick={handleContextSwitch}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            I Switched Context (Add Penalty)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleContextLockMode;
