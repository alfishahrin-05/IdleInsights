import { X, Play } from 'lucide-react';
import './FloatingFrictionWidget.css';

const FloatingFrictionWidget = ({ category, onStartTracking, onDismiss }) => {
  const categoryEmojis = {
    social: '📱',
    video: '📺',
    gaming: '🎮',

    browsing: '🌐'
  };

  const categoryNames = {
    social: 'Social Media',
    video: 'Videos',
    gaming: 'Gaming',

    browsing: 'Browsing'
  };

  return (
    <div className="floating-friction-widget">
      <button 
        className="widget-close"
        onClick={onDismiss}
        title="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="widget-emoji">
        {categoryEmojis[category] || '🌐'}
      </div>

      <div className="widget-content">
        <h3>Still doomscrolling?</h3>
        <p>Let me help you get back on track</p>
      </div>

      <button 
        className="widget-track-button"
        onClick={onStartTracking}
      >
        <Play size={18} />
        Track my {categoryNames[category] || 'browsing'}
      </button>

      <div className="widget-hint">
        I'll remind you with mindful pauses
      </div>
    </div>
  );
};

export default FloatingFrictionWidget;
