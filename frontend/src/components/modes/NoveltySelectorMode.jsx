import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Zap, TrendingUp, Trophy, Clock, Medal, AlertCircle } from 'lucide-react';

const NoveltySelectorMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [xpPoints, setXpPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [lastSessionDate, setLastSessionDate] = useState(null);
  const [weeklyXp, setWeeklyXp] = useState({});

  const levelTitles = {
    1: 'Focus Novice',
    5: 'Focus Apprentice',
    15: 'Productivity Knight',
    30: 'Focus Master',
    50: 'Grindmaster'
  };

  const achievements_list = [
    { id: 'early_bird', name: 'Early Bird', desc: 'Start session before 8 AM', icon: '🌅' },
    { id: 'night_owl', name: 'Night Owl', desc: 'Complete task after 10 PM', icon: '🦉' },
    { id: 'marathon', name: 'Marathon Runner', desc: '4-hour uninterrupted session', icon: '🏃' },
    { id: 'streak_3', name: 'On Fire', desc: '3-day work streak', icon: '🔥' },
    { id: 'level_10', name: 'Level Milestone', desc: 'Reach Level 10', icon: '📈' }
  ];

  const miniChallenges = [
    { id: 'sprint', name: 'Sprint Mode', desc: 'Complete task 10% faster than average', bonus: 50 },
    { id: 'no_distraction', name: 'No-Distraction Mode', desc: 'Zero logged distractions in 30 min', bonus: 100 },
    { id: 'focus_zen', name: 'Focus Zen', desc: 'Stay focused for 45+ minutes straight', bonus: 75 },
    { id: 'power_hour', name: 'Power Hour', desc: 'Complete 3 tasks in 60 minutes', bonus: 150 }
  ];

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
        setSessionMinutes(prev => prev + 1);
        
        // Award XP: 100 XP per 20 minutes
        if (sessionMinutes % 20 === 0) {
          const newXp = xpPoints + 100;
          setXpPoints(newXp);
          
          // Track weekly XP for leaderboard
          const today = new Date().toISOString().split('T')[0];
          setWeeklyXp(prev => ({
            ...prev,
            [today]: (prev[today] || 0) + 100
          }));
          
          // Calculate level (every 1000 XP = 1 level)
          const newLevel = Math.floor(newXp / 1000) + 1;
          if (newLevel > level) {
            setLevel(newLevel);
            unlockNewTitle(newLevel);
          }
        }
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isRunning, sessionMinutes, xpPoints, level]);

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
      if (response.data.novelty) {
        setXpPoints(response.data.novelty.totalXp || 0);
        setLevel(Math.floor((response.data.novelty.totalXp || 0) / 1000) + 1);
        setStreakDays(response.data.novelty.streakDays || 0);
        setAchievements(response.data.novelty.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching mode:', error);
    }
  };

  const unlockNewTitle = (newLevel) => {
    const title = Object.entries(levelTitles).reverse().find(([lvl]) => newLevel >= lvl)?.[1];
    if (title) {
      alert(`🎉 Level Up! You're now a "${title}"`);
    }
  };

  const handleActivateMode = async () => {
    if (!selectedTaskId) {
      alert('Please select a task');
      return;
    }

    try {
      // Calculate streak
      const today = new Date().toDateString();
      let newStreak = streakDays;
      if (lastSessionDate) {
        const lastDate = new Date(lastSessionDate);
        const daysDiff = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      setStreakDays(newStreak);
      setLastSessionDate(today);

      // Calculate streak bonuses
      let streakBonus = 0;
      if (newStreak >= 7) {
        streakBonus = 150; // 7-day streak
      } else if (newStreak >= 3) {
        streakBonus = 50; // 3-day streak
      }

      const payload = {
        activeMode: 'NOVELTY_INJECTION',
        taskId: selectedTaskId,
        novelty: {
          totalXp: xpPoints + streakBonus,
          streakDays: newStreak,
          achievements
        }
      };
      const response = await API.post('/modes/activate', payload);
      setMode(response.data);
      navigate(`/modes/novelty-injection/${response.data._id}`);
      setIsRunning(true);
      
      // Show random challenge
      const randomChallenge = miniChallenges[Math.floor(Math.random() * miniChallenges.length)];
      setCurrentChallenge(randomChallenge);
      setShowChallengeModal(true);
      
      if (streakBonus > 0) {
        alert(`🔥 Streak Bonus: +${streakBonus} XP for ${newStreak}-day streak!`);
      }
    } catch (error) {
      console.error('Error activating mode:', error);
      alert('Failed to activate mode');
    }
  };

  const handleCompleteTask = () => {
    const taskXp = 200;
    const newTotal = xpPoints + taskXp;
    setXpPoints(newTotal);
    alert(`✨ Task complete! +${taskXp} XP gained!`);
  };

  const handleChallengeComplete = () => {
    if (!currentChallenge) return;
    
    const bonus = currentChallenge.bonus;
    const newXp = xpPoints + bonus;
    setXpPoints(newXp);
    setCompletedChallenges([...completedChallenges, currentChallenge.id]);
    setShowChallengeModal(false);
    alert(`🎯 Challenge Complete: "${currentChallenge.name}" +${bonus} XP!`);
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

  const getLevelTitle = () => {
    for (let [lvl, title] of Object.entries(levelTitles).reverse()) {
      if (level >= lvl) return title;
    }
    return 'Focus Novice';
  };

  const xpToNextLevel = (level * 1000) - xpPoints;

  // Setup view
  if (!modeId) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🎮 Novelty Injection Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Gamify boring tasks with XP, levels, and achievements
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Start Your Quest</h2>

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
                <li>Earn 100 XP per 20 minutes of focused work</li>
                <li>Complete tasks for +200 bonus XP</li>
                <li>Gain levels and unlock achievement badges</li>
                <li>Build streaks for multiplier bonuses</li>
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
              Start Quest
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view
  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>🎮 Novelty Injection Mode</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Active • {selectedTaskId && tasks.find(t => t._id === selectedTaskId)?.title}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
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
        </div>

        {/* Level Display */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          border: '2px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                {level}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Level
              </div>
              <div style={{ fontWeight: '600', color: '#e2e8f0' }}>
                {getLevelTitle()}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                {xpPoints.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                XP Points
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {xpToNextLevel} XP to next level
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                {sessionMinutes}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Minutes Worked
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                This session
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                {streakDays}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Day Streak
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Keep it going!
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', display: 'block' }}>
            XP Progress to Level {level + 1}
          </label>
          <div style={{
            width: '100%',
            height: '16px',
            borderRadius: '8px',
            background: 'rgba(148, 163, 184, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, ((xpPoints % 1000) / 1000) * 100)}%`,
              background: 'linear-gradient(to right, #f59e0b, #6366f1)',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} /> Achievements ({achievements.length}/{achievements_list.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            {achievements_list.map(achievement => {
              const isUnlocked = achievements.includes(achievement.id);
              return (
                <div 
                  key={achievement.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: isUnlocked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.05)',
                    border: `2px solid ${isUnlocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
                    textAlign: 'center',
                    cursor: 'default',
                    opacity: isUnlocked ? 1 : 0.5,
                    transition: '0.3s'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {achievement.icon}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {achievement.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {achievement.desc}
                  </div>
                  {isUnlocked && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>
                      ✓ Unlocked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleCompleteTask}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'linear-gradient(to right, #f59e0b, #ec4899)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Medal size={20} /> Complete Task (+200 XP)
        </button>

        {/* Challenge Modal */}
        {showChallengeModal && currentChallenge && (
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
              textAlign: 'center',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                {currentChallenge.name}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                {currentChallenge.desc}
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.15)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontWeight: '600',
                color: '#f59e0b',
                fontSize: '1.1rem'
              }}>
                💰 +{currentChallenge.bonus} XP Bonus
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
                Complete this challenge during your session to earn the bonus!
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowChallengeModal(false)}
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
                  Not Now
                </button>
                <button
                  onClick={handleChallengeComplete}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Accept Challenge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoveltySelectorMode;
