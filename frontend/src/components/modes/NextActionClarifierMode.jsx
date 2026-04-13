import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActionClarifierWizard from './ActionClarifierWizard';
import API from '../../services/api';
import { ArrowRight, Plus, CheckCircle } from 'lucide-react';

const NextActionClarifierMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [clarifiedTasks, setClarifiedTasks] = useState([]);
  const [vagueTasksCount, setVagueTasksCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(!modeId);

  useEffect(() => {
    if (modeId) {
      fetchModeDetails();
    }
    fetchClarifiedTasks();
  }, [modeId]);

  const fetchModeDetails = async () => {
    try {
      const response = await API.get(`/modes/${modeId}`);
      setMode(response.data);
    } catch (error) {
      console.error('Error fetching mode:', error);
    }
  };

  const fetchClarifiedTasks = async () => {
    try {
      const response = await API.get('/tasks');
      const clarified = response.data.filter(t => !t.isVague && t.status === 'active' && t.clarificationDetails?.firstAction);
      const vague = response.data.filter(t => t.isVague && t.status === 'active');
      setClarifiedTasks(clarified);
      setVagueTasksCount(vague.length);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleWizardComplete = async () => {
    setShowWizard(false);
    await fetchClarifiedTasks();
    
    if (!modeId) {
      try {
        setLoading(true);
        const response = await API.post('/modes/activate', {
          activeMode: 'NEXT_ACTION_CLARIFIER'
        });
        setMode(response.data);
        navigate(`/modes/next-action-clarifier/${response.data._id}`);
      } catch (error) {
        console.error('Error activating mode:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartNewClarification = () => {
    setShowWizard(true);
  };

  const handleDeactivateMode = async () => {
    if (!mode) return;
    
    try {
      await API.delete(`/modes/${mode._id}`);
      setMode(null);
      navigate('/modes');
      alert('Mode deactivated');
    } catch (error) {
      console.error('Error deactivating mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  // Setup view - wizard shown
  if (!modeId && showWizard) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="card">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Clarification Wizard</h2>
              <button 
                onClick={() => setShowWizard(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                ✕
              </button>
            </div>
            <ActionClarifierWizard 
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Setup view - intro screen
  if (!modeId && !showWizard) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🎯 Next-Action Clarifier Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Transform vague tasks into concrete, actionable first steps
            </p>
          </div>

          {vagueTasksCount > 0 && (
            <div className="card" style={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)', 
              borderLeft: '4px solid #f59e0b',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>📝</div>
                <div>
                  <h3 style={{ margin: 0 }}>Found {vagueTasksCount} Vague Task{vagueTasksCount !== 1 ? 's' : ''}</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)' }}>
                    Ready to clarify? Start the wizard to turn them into actionable items.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ 
            padding: '2rem', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧙</div>
            <h3 style={{ marginBottom: '1rem' }}>Start the Clarification Wizard</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
              This guided 5-step process will help you define exactly what you need to do, where you'll do it, and your first concrete action.
            </p>
            <button 
              onClick={handleStartNewClarification}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={18} /> Start Wizard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view (with modeId)
  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>🎯 Next-Action Clarifier Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Active • {clarifiedTasks.length} clarified task{clarifiedTasks.length !== 1 ? 's' : ''}
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
            Deactivate
          </button>
        </div>

        {/* Wizard - Hidden by default, toggle with button */}
        {showWizard && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Clarification Wizard</h2>
              <button 
                onClick={() => setShowWizard(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                ✕
              </button>
            </div>
            <ActionClarifierWizard 
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        )}

        {/* Clarified Tasks */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Your Clarified Tasks</h2>
            <button 
              onClick={handleStartNewClarification}
              style={{
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} /> Add Clarification
            </button>
          </div>

          {clarifiedTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {clarifiedTasks.map(task => (
                <div
                  key={task._id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{task.title}</h4>
                      <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        <strong>First Action:</strong> {task.clarificationDetails?.firstAction}
                      </p>
                      {task.clarificationDetails?.location && (
                        <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                          <strong>Location:</strong> {task.clarificationDetails.location}
                        </p>
                      )}
                      {task.clarificationDetails?.timeEstimate && (
                        <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                          <strong>Est. Time:</strong> {task.clarificationDetails.timeEstimate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No clarified tasks yet. Start the wizard to transform a vague task!
            </p>
          )}
        </div>

        {/* Tips Card */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <h3 style={{ marginBottom: '1rem' }}>💡 Clarification Tips</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>First actions should take ≤15 minutes.</strong> This reduces procrastination friction.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Use action verbs:</strong> "Create", "Write", "Fix", "Design" - not "Think about" or "Plan".
            </li>
            <li>
              <strong>Location specificity helps.</strong> "VS Code /src/main.js" is better than "Computer".
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NextActionClarifierMode;
