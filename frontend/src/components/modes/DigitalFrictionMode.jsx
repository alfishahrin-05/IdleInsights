import { useState, useEffect } from 'react';
import { CheckCircle, PlayCircle, StopCircle, Clock, ArrowLeft, Zap } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import FrictionPauseModal from './FrictionPauseModal';
import './DigitalFrictionMode.css';

const DigitalFrictionMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [activeModeId, setActiveModeId] = useState(modeId || null);
  const [isActivated, setIsActivated] = useState(!!modeId);
  const [activating, setActivating] = useState(false);
  const [settings, setSettings] = useState({
    enabledCategories: ['social', 'video'],
    pauseDuration: 10, // seconds
    triggerAfterMinutes: 5,
    showDailyReport: true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Standalone browsing timer state
  const [selectedBrowsingTime, setSelectedBrowsingTime] = useState(5);
  const [customTime, setCustomTime] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browsingElapsed, setBrowsingElapsed] = useState(0);
  const [browsingTarget, setBrowsingTarget] = useState(0);
  const [showFrictionPause, setShowFrictionPause] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);

  const DISTRACTION_CATEGORIES = [
    { id: 'social', name: 'Social Media', emoji: '📱', color: '#3b5998' },
    { id: 'video', name: 'Video Streaming', emoji: '▶️', color: '#ff0000' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮', color: '#8b5cf6' },
    { id: 'browsing', name: 'Random Browsing', emoji: '🌐', color: '#059669' }
  ];

  const handleToggleCategory = (categoryId) => {
    setSettings(prev => ({
      ...prev,
      enabledCategories: prev.enabledCategories.includes(categoryId)
        ? prev.enabledCategories.filter(c => c !== categoryId)
        : [...prev.enabledCategories, categoryId]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await API.put(`/modes/${activeModeId}`, { settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleActivateMode = async () => {
    if (settings.enabledCategories.length === 0) {
      alert('Please select at least one category to monitor');
      return;
    }

    setActivating(true);
    try {
      const response = await API.post('/modes/activate', {
        activeMode: 'DIGITAL_FRICTION',
        settings
      });
      setActiveModeId(response.data._id);
      setIsActivated(true);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      // Update URL without full reload
      navigate(`/modes/digital-friction/${response.data._id}`, { replace: true });
    } catch (error) {
      console.error('Failed to activate mode:', error);
      alert('Failed to activate mode');
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!activeModeId) return;
    try {
      await API.delete(`/modes/${activeModeId}`);
      setIsActivated(false);
      setActiveModeId(null);
      navigate('/modes/digital-friction', { replace: true });
    } catch (error) {
      console.error('Failed to deactivate mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  // Load existing settings if editing an already-active mode
  useEffect(() => {
    if (!activeModeId) return;
    const loadSettings = async () => {
      try {
        const res = await API.get('/modes/active');
        if (res.data && res.data.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
          setIsActivated(true);
        }
      } catch (error) {
        console.error('Failed to load mode settings:', error);
      }
    };
    loadSettings();
  }, [activeModeId]);

  // Standalone browsing timer
  useEffect(() => {
    if (!isBrowsing) return;

    const interval = setInterval(() => {
      setBrowsingElapsed(prev => {
        const newElapsed = prev + 1;
        
        // Check if we hit the target time
        if (newElapsed >= browsingTarget) {
          setShowFrictionPause(true);
          return newElapsed;
        }
        
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBrowsing, browsingTarget]);

  const handleStartBrowsing = () => {
    const minutes = selectedBrowsingTime === 'custom' ? parseInt(customTime) : selectedBrowsingTime;
    if (!minutes || minutes <= 0) {
      alert('Please enter a valid time');
      return;
    }
    
    setBrowsingTarget(minutes * 60);
    setBrowsingElapsed(0);
    setPauseCount(0);
    setIsBrowsing(true);
  };

  const handleStopBrowsing = () => {
    setIsBrowsing(false);
    setBrowsingElapsed(0);
    setPauseCount(0);
    setShowFrictionPause(false);
  };

  const handleReturnFromPause = () => {
    setShowFrictionPause(false);
    handleStopBrowsing();
  };

  const handleContinueBrowsing = () => {
    setShowFrictionPause(false);
    setPauseCount(prev => prev + 1);
    // Add 5 more minutes
    setBrowsingTarget(prev => prev + (5 * 60));
  };

  const getCurrentPauseDuration = () => {
    // Escalate: 10s → 15s → 20s
    return Math.min(20, settings.pauseDuration + (pauseCount * 5));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mode-setup-container">
      <div className="mode-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Link to="/modes" style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0 }}>🚧 Digital Friction Mode</h1>
          {isActivated && (
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              ACTIVE
            </span>
          )}
        </div>
        <p className="subtitle">Break doomscroll loops with mindful pauses</p>
      </div>

      {/* How It Works */}
      <section className="mode-section">
        <h2>How It Works</h2>
        <div className="mechanics-list">
          <div className="mechanic-card">
            <div className="step-number">1</div>
            <h3>Distraction Detection</h3>
            <p>When you log time on social media, videos, or other distracting sites...</p>
          </div>
          <div className="mechanic-card">
            <div className="step-number">2</div>
            <h3>Pause Injection</h3>
            <p>After {settings.triggerAfterMinutes} minutes, a mindful pause appears automatically</p>
          </div>
          <div className="mechanic-card">
            <div className="step-number">3</div>
            <h3>Mindful Return</h3>
            <p>You're prompted: "Return to your task?" This pause creates the friction needed to break the loop</p>
          </div>
          <div className="mechanic-card">
            <div className="step-number">4</div>
            <h3>Escalating Friction</h3>
            <p>Each subsequent pause gets longer (10s → 15s → 20s) to increase awareness</p>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="mode-section">
        <h2>Configuration</h2>
        
        <div className="settings-group">
          <label className="settings-label">
            <strong>Monitored Categories</strong>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Select which types of distractions should trigger pauses:
            </p>
          </label>
          
          <div className="category-grid">
            {DISTRACTION_CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`category-card ${settings.enabledCategories.includes(category.id) ? 'active' : ''}`}
                onClick={() => handleToggleCategory(category.id)}
                style={{
                  borderColor: settings.enabledCategories.includes(category.id) ? category.color : 'var(--color-border)',
                  backgroundColor: settings.enabledCategories.includes(category.id) ? `${category.color}15` : 'transparent'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{category.emoji}</div>
                <div style={{ fontWeight: 500 }}>{category.name}</div>
                {settings.enabledCategories.includes(category.id) && (
                  <CheckCircle size={16} style={{ position: 'absolute', top: '8px', right: '8px', color: category.color }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <strong>Allow Browsing For</strong>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              How many minutes before the first friction pause appears:
            </p>
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="range"
              min="1"
              max="15"
              value={settings.triggerAfterMinutes}
              onChange={(e) => setSettings(prev => ({ ...prev, triggerAfterMinutes: parseInt(e.target.value) }))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 500, minWidth: '40px' }}>{settings.triggerAfterMinutes} min</span>
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <strong>Initial Pause Duration</strong>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Starting pause (will escalate to 15s, then 20s):
            </p>
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="range"
              min="5"
              max="15"
              step="5"
              value={settings.pauseDuration}
              onChange={(e) => setSettings(prev => ({ ...prev, pauseDuration: parseInt(e.target.value) }))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 500, minWidth: '50px' }}>{settings.pauseDuration}s</span>
          </div>
        </div>

        <div className="settings-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showDailyReport}
              onChange={(e) => setSettings(prev => ({ ...prev, showDailyReport: e.target.checked }))}
            />
            <span><strong>Show Daily Report</strong></span>
          </label>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Display total time "rescued" from doomscrolling at end of session
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mode-section">
        <h2>Expected Benefits</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>30-40% reduction</strong> in doomscroll distraction time
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>Increased awareness</strong> of automatic browsing habits
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>Self-interruption</strong> becomes your natural response
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {!isActivated ? (
          <button
            className="btn btn-primary"
            onClick={handleActivateMode}
            disabled={activating}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.9rem' }}
          >
            <Zap size={18} />
            {activating ? 'Activating...' : 'Activate Mode'}
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={handleSaveSettings}
              style={{ flex: 1 }}
            >
              Save Settings
            </button>
            <button
              className="btn"
              onClick={handleDeactivate}
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              Deactivate
            </button>
          </>
        )}
      </div>

      {savedSuccess && (
        <div className="success-toast">
          <CheckCircle size={20} />
          {isActivated ? 'Settings saved! Mode is active for your next session.' : 'Mode activated!'}
        </div>
      )}

      {/* Standalone Browsing Timer */}
      <section className="mode-section" style={{ marginTop: '3rem', border: '2px solid var(--color-primary)', borderRadius: '12px', padding: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} />
          Try Mode Now (Standalone)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Use this mode right now without an active session. Set how long you want to browse, and we'll remind you with friction pauses.
        </p>

        {!isBrowsing ? (
          <>
            <div className="time-selection">
              <label className="settings-label" style={{ marginBottom: '1rem' }}>
                <strong>How long do you want to browse?</strong>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {[5, 10, 15, 30].map(time => (
                  <button
                    key={time}
                    className={`time-option ${selectedBrowsingTime === time ? 'active' : ''}`}
                    onClick={() => setSelectedBrowsingTime(time)}
                  >
                    {time} min
                  </button>
                ))}
                <button
                  className={`time-option ${selectedBrowsingTime === 'custom' ? 'active' : ''}`}
                  onClick={() => setSelectedBrowsingTime('custom')}
                >
                  Custom
                </button>
              </div>

              {selectedBrowsingTime === 'custom' && (
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Enter minutes"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="custom-time-input"
                  />
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleStartBrowsing}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '1rem' }}
            >
              <PlayCircle size={20} />
              Start Browsing Session
            </button>
          </>
        ) : (
          <>
            <div className="browsing-timer-display">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Time elapsed
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {formatTime(browsingElapsed)}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Target: {formatTime(browsingTarget)} • Pauses: {pauseCount}
                </div>
              </div>

              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'var(--color-bg-secondary)', 
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  width: `${Math.min(100, (browsingElapsed / browsingTarget) * 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleStopBrowsing}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <StopCircle size={18} />
                Stop Session
              </button>
            </div>
          </>
        )}
      </section>

      {/* Friction Pause Modal */}
      <FrictionPauseModal
        isOpen={showFrictionPause}
        duration={getCurrentPauseDuration()}
        onReturnToTask={handleReturnFromPause}
        onContinueBrowsing={handleContinueBrowsing}
        taskName={null}
      />
    </div>
  );
};

export default DigitalFrictionMode;
