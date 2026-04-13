import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';

const DoneOverPerfectMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timeBoxMinutes, setTimeBoxMinutes] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [checkpointsPassed, setCheckpointsPassed] = useState([]);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const quotes = [
    'Done is better than perfect.',
    'Shipped beats polished.',
    'Progress over perfection.',
    'Perfect is the enemy of good.',
    'Real recognizes real—reality over reflection.',
    '80% of value comes from 20% of effort.',
    'Iterate fast. Perfect slowly.',
    'Move the needle, not the millimeter.'
  ];

  useEffect(() => {
    fetchTasks();
    if (modeId) {
      fetchModeDetails();
    }
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [modeId]);

  useEffect(() => {
    let interval;
    if (isRunning && !sessionCompleted) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        
        // Check for checkpoints
        const totalSeconds = timeBoxMinutes * 60;
        const checkpoint25 = totalSeconds * 0.25;
        const checkpoint50 = totalSeconds * 0.5;
        const checkpoint75 = totalSeconds * 0.75;
        const checkpoint100 = totalSeconds;

        if (prev + 1 === Math.floor(checkpoint25) && !checkpointsPassed.includes(25)) {
          setCurrentCheckpoint(25);
          setShowCheckpointModal(true);
          setCheckpointsPassed(p => [...p, 25]);
          setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        }
        if (prev + 1 === Math.floor(checkpoint50) && !checkpointsPassed.includes(50)) {
          setCurrentCheckpoint(50);
          setShowCheckpointModal(true);
          setCheckpointsPassed(p => [...p, 50]);
          setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        }
        if (prev + 1 === Math.floor(checkpoint75) && !checkpointsPassed.includes(75)) {
          setCurrentCheckpoint(75);
          setShowCheckpointModal(true);
          setCheckpointsPassed(p => [...p, 75]);
          setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        }

        // Auto-complete at 100%
        if (prev + 1 >= totalSeconds) {
          handleComplete();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeBoxMinutes, checkpointsPassed, sessionCompleted]);

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
      if (response.data.perfectionism?.timeBoxMinutes) {
        setTimeBoxMinutes(response.data.perfectionism.timeBoxMinutes);
      }
      if (response.data.perfectionism?.selectedTaskId) {
        setSelectedTaskId(response.data.perfectionism.selectedTaskId);
      }
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
        activeMode: 'DONE_OVER_PERFECT',
        taskId: selectedTaskId,
        perfectionism: {
          timeBoxMinutes,
          selectedTaskId
        }
      };
      const response = await API.post('/modes/activate', payload);
      setMode(response.data);
      navigate(`/modes/done-over-perfect/${response.data._id}`);
      setIsRunning(true);
    } catch (error) {
      console.error('Error activating mode:', error);
      alert('Failed to activate mode');
    }
  };

  const handleCheckpointResponse = (isGoodEnough) => {
    if (isGoodEnough) {
      setShowCheckpointModal(false);
      alert('🎉 Great! You\'ve decided it\'s good enough. Task completed!');
      setSessionCompleted(true);
      setShowReflectionModal(true);
      setIsRunning(false);
    } else {
      setShowCheckpointModal(false);
      const timeSpent = elapsedSeconds / 60;
      const percentComplete = (elapsedSeconds / (timeBoxMinutes * 60)) * 100;
      alert(`💡 You've spent ${timeSpent.toFixed(0)} min (${percentComplete.toFixed(0)}% of time-box).\n80% of value likely achieved. Continue if needed!`);
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setSessionCompleted(true);
    setShowReflectionModal(true);
  };

  const submitReflection = async () => {
    try {
      // Save reflection to backend
      if (modeId && selectedTaskId) {
        await API.put(`/tasks/${selectedTaskId}`, {
          reflection: userResponse
        });
      }
      alert('✅ Session complete! Reflection saved.');
      handleDeactivateMode();
    } catch (error) {
      console.error('Error saving reflection:', error);
      handleDeactivateMode();
    }
  };

  const handleDeactivateMode = async () => {
    if (!mode) return;
    
    try {
      await API.delete(`/modes/${mode._id}`);
      setMode(null);
      setIsRunning(false);
      navigate('/modes');
    } catch (error) {
      console.error('Error deactivating mode:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = timeBoxMinutes * 60;
  const progressPercent = (elapsedSeconds / totalSeconds) * 100;
  const isInDiminishingReturnsZone = progressPercent >= 50;

  // Setup view
  if (!modeId) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>✅ Done-Over-Perfect Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Time-box your work to overcome perfectionism and ship faster
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Setup Your Time-Box</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Task
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Time-Box Duration: {timeBoxMinutes} minutes
              </label>
              <input 
                type="range"
                min="5"
                max="120"
                value={timeBoxMinutes}
                onChange={(e) => setTimeBoxMinutes(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                <span>5m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
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
                <li>Work for exactly {timeBoxMinutes} minutes on your task</li>
                <li>At 25%, 50%, 75%: System asks "Is this good enough?"</li>
                <li>Say yes = task complete, end early with achievement</li>
                <li>At 100%: Task auto-completes with reflection prompt</li>
                <li>Motivational quotes combat perfectionism urges</li>
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
              Start Time-Box
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>✅ Done-Over-Perfect Mode</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Active • {selectedTaskId && tasks.find(t => t._id === selectedTaskId)?.title}
          </p>
        </div>

        {/* Timer */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              color: '#10b981'
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
                width: `${progressPercent}%`,
                background: isInDiminishingReturnsZone ? 'linear-gradient(to right, #f59e0b, #ef4444)' : 'linear-gradient(to right, #10b981, #6366f1)',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {Math.round(progressPercent)}% complete
            </p>

            {/* Diminishing Returns Badge */}
            {isInDiminishingReturnsZone && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                color: '#f59e0b',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                ⚠️ Diminishing Returns Zone - Consider wrapping up!
              </div>
            )}
          </div>
        </div>

        {/* Checkpoints */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Progress Checkpoints</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[25, 50, 75, 100].map((checkpoint) => {
              const isPassed = checkpointsPassed.includes(checkpoint) || (checkpoint <= progressPercent);
              return (
                <div 
                  key={checkpoint}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: isPassed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(148, 163, 184, 0.05)',
                    border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isPassed ? (
                      <CheckCircle size={20} style={{ color: '#10b981' }} />
                    ) : (
                      <Clock size={20} style={{ color: '#94a3b8' }} />
                    )}
                    <span style={{ fontWeight: '600' }}>
                      {checkpoint}% Complete {checkpoint < 100 && '- "Is this good enough to submit?"'}
                    </span>
                  </div>
                  {checkpoint === 100 && isPassed && (
                    <span style={{ fontSize: '0.9rem', color: '#10b981' }}>
                      ✓ Complete
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Section */}
        {motivationalQuote && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
            border: '2px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Zap size={32} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', fontStyle: 'italic' }}>
                  "{motivationalQuote}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setIsRunning(!isRunning)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isRunning ? '#ef4444' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={handleDeactivateMode}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Checkpoint Modal */}
      {showCheckpointModal && (
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
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '450px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>
              {currentCheckpoint}% complete!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              You're at {currentCheckpoint}% of your time-box. Is what you have good enough to submit or share?
            </p>
            
            {motivationalQuote && (
              <div style={{
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                color: '#cbd5e1'
              }}>
                💡 "{motivationalQuote}"
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleCheckpointResponse(false)}
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
                Not Yet, Keep Going
              </button>
              <button
                onClick={() => handleCheckpointResponse(true)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Yes, It's Done! ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflectionModal && (
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
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Session Reflection</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              In hindsight, was the extra refinement worth the time spent? This helps us understand your perfectionistic patterns.
            </p>
            
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Share your thoughts on the time spent vs. value delivered..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                minHeight: '100px',
                resize: 'vertical',
                marginBottom: '1.5rem'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={submitReflection}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Save Reflection & End
              </button>
              <button
                onClick={submitReflection}
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
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoneOverPerfectMode;
