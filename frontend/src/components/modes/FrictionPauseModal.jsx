import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import './FrictionPauseModal.css';

const FrictionPauseModal = ({ isOpen, duration = 10, onReturnToTask, onContinueBrowsing, taskName }) => {
  const [remaining, setRemaining] = useState(duration);
  const [allowDismiss, setAllowDismiss] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setRemaining(duration);
    setAllowDismiss(false);

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setAllowDismiss(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, duration]);

  if (!isOpen) return null;

  return (
    <div className="friction-pause-overlay">
      <div className="friction-pause-modal">
        {/* Breathing Circle */}
        <div className="breathing-container">
          <div className={`breathing-circle ${!allowDismiss ? 'breathing' : 'complete'}`}>
            <div className="circle-inner">
              <div className="countdown-number">{remaining}</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="pause-title">Take a Breath</h2>
        <p className="pause-subtitle">
          You've been scrolling for a while. Let's pause for a moment.
        </p>

        {/* Countdown Info */}
        {!allowDismiss && (
          <p className="pause-timer">
            Pause active for {remaining} more second{remaining !== 1 ? 's' : ''}...
          </p>
        )}

        {/* Buttons */}
        {allowDismiss && (
          <div className="pause-buttons">
            <button
              className="btn btn-primary pause-button"
              onClick={onReturnToTask}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                width: '100%'
              }}
            >
              Return to {taskName ? `"${taskName}"` : 'Task'}
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary pause-button"
              onClick={onContinueBrowsing}
              style={{ width: '100%' }}
            >
              Continue Browsing (5 min)
            </button>
          </div>
        )}

        {/* Educational Message */}
        <p className="pause-info">
          💡 This pause helps break automatic scrolling patterns. Over time, you'll notice fewer distractions.
        </p>
      </div>
    </div>
  );
};

export default FrictionPauseModal;
