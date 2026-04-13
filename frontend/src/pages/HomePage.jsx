import { useNavigate, Link } from 'react-router-dom';
import { Zap, Clock, Target, Brain, Lock, Lightbulb, ArrowRight, CheckCircle, TrendingUp, BarChart3, Activity } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const modes = [
    {
      id: 'TASK_DECONSTRUCTOR',
      emoji: '🧩',
      name: 'Task Deconstructor',
      description: 'Break overwhelming projects into bite-sized sub-tasks',
      color: '#6366f1'
    },
    {
      id: 'DIGITAL_FRICTION',
      emoji: '🚧',
      name: 'Digital Friction',
      description: 'Add mindful pauses to break doomscroll loops',
      color: '#8b5cf6'
    },
    {
      id: 'DONE_OVER_PERFECT',
      emoji: '✅',
      name: 'Done-Over-Perfect',
      description: 'Time-box tasks to overcome perfectionism',
      color: '#10b981'
    },
    {
      id: 'NOVELTY_INJECTION',
      emoji: '🎮',
      name: 'Novelty Injection',
      description: 'Gamify boring tasks with XP and achievements',
      color: '#f59e0b'
    },
    {
      id: 'SINGLE_CONTEXT_LOCK',
      emoji: '🔒',
      name: 'Single-Context Lock',
      description: 'Deep focus Pomodoro-style sessions',
      color: '#ef4444'
    },
    {
      id: 'NEXT_ACTION_CLARIFIER',
      emoji: '🎯',
      name: 'Next-Action Clarifier',
      description: 'Transform vague tasks into concrete action steps',
      color: '#ec4899'
    }
  ];

  const features = [
    {
      icon: <Activity size={32} style={{ color: '#6366f1' }} />,
      title: 'Smart Analytics',
      description: 'Identify your procrastination patterns with AI-powered insights'
    },
    {
      icon: <TrendingUp size={32} style={{ color: '#8b5cf6' }} />,
      title: 'Track Progress',
      description: 'Visualize your focus improvements with detailed metrics'
    },
    {
      icon: <BarChart3 size={32} style={{ color: '#10b981' }} />,
      title: 'Behavior Tracking',
      description: 'Log avoidance events and understand your triggers'
    }
  ];

  return (
    <div style={{ background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.5rem', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          IdleInsights
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" style={{ padding: '0.75rem 1.25rem', color: '#e2e8f0', textDecoration: 'none', borderRadius: '6px', transition: '0.3s' }} 
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'} 
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            Login
          </Link>
          <button 
            onClick={() => navigate('/register')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: '0.3s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Conquer Procrastination<br />Reclaim Your Focus
        </h1>

        <button 
          onClick={() => navigate('/register')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: '0.3s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Get Started <ArrowRight size={20} />
        </button>
      </section>

      {/* Modes Grid */}
      <section style={{
        padding: '4rem 2rem',
        background: 'rgba(99, 102, 241, 0.05)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' }}>
            6 Counter-Measure Modes
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {modes.map((mode) => (
              <div 
                key={mode.id}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  transition: '0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(${parseInt(mode.color.slice(1,3),16)}, ${parseInt(mode.color.slice(3,5),16)}, ${parseInt(mode.color.slice(5,7),16)}, 0.2)`;
                  e.currentTarget.style.borderColor = mode.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                  {mode.emoji}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: mode.color }}>
                  {mode.name}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                  {mode.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' }}>
          Why IdleInsights Works
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#cbd5e1' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '4rem 2rem',
        background: 'rgba(99, 102, 241, 0.05)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { step: '1', title: 'Identify', desc: 'Analyze your procrastination patterns with smart tracking' },
              { step: '2', title: 'Choose', desc: 'Select the perfect mode for your specific challenge' },
              { step: '3', title: 'Activate', desc: 'Launch the mode and start your focused work session' },
              { step: '4', title: 'Track', desc: 'Monitor improvements and celebrate your progress' }
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: '0 auto 1rem'
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#cbd5e1' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
            Ready to Unlock Your Potential?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem' }}>
            Join thousands of focused professionals who've transformed their productivity with IdleInsights.
          </p>
          <button 
            onClick={() => navigate('/register')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.3s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Get Started Now <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.9rem'
      }}>
        <p>© 2026 IdleInsights. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
