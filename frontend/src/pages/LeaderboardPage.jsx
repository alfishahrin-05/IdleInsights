import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { TrendingUp, Trophy, Flame, Target, BarChart3, ArrowLeft } from 'lucide-react';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalXp: 0,
    currentLevel: 1,
    streakDays: 0,
    weeklyXp: {},
    completedChallenges: [],
    pastWeeks: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, this would fetch from the backend
      // For now, we'll use local data
      const mockStats = {
        totalXp: 3500,
        currentLevel: 4,
        streakDays: 7,
        weeklyXp: {
          'Mon': 500,
          'Tue': 600,
          'Wed': 450,
          'Thu': 700,
          'Fri': 650,
          'Sat': 400,
          'Sun': 300
        },
        completedChallenges: [
          { name: 'Sprint Mode', bonus: 50, date: '2025-01-08' },
          { name: 'Power Hour', bonus: 150, date: '2025-01-07' },
          { name: 'No-Distraction Mode', bonus: 100, date: '2025-01-06' }
        ],
        pastWeeks: [
          { week: 'Week 1', xp: 3200 },
          { week: 'Week 2', xp: 3500 }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const totalWeeklyXp = Object.values(stats.weeklyXp).reduce((a, b) => a + b, 0);
  const maxDaily = Math.max(...Object.values(stats.weeklyXp), 1);

  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1>📊 Novelty Leaderboard & Stats</h1>
        </div>

        {/* Top Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Total XP
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
              {stats.totalXp.toLocaleString()}
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Current Level
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.currentLevel}
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Streak
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.streakDays}d
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              This Week
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {totalWeeklyXp}
            </div>
          </div>
        </div>

        {/* Weekly XP Chart */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} /> Weekly Breakdown
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px' }}>
            {Object.entries(stats.weeklyXp).map(([day, xp]) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${(xp / maxDaily) * 150}px`,
                    background: xp > 500 ? 'linear-gradient(to top, #6366f1, #8b5cf6)' : 'linear-gradient(to top, #f59e0b, #ec4899)',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '10px',
                    transition: 'all 0.3s'
                  }}
                />
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{day}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {xp} XP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Challenges */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} /> Recent Challenge Wins
          </h3>
          {stats.completedChallenges.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.completedChallenges.map((challenge, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {challenge.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {new Date(challenge.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    +{challenge.bonus} XP
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No challenges completed yet. Start a session to earn bonuses!
            </p>
          )}
        </div>

        {/* Weekly Comparison */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} /> Performance Trend
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.pastWeeks.map((week, idx) => {
              const isCurrentWeek = idx === stats.pastWeeks.length - 1;
              const maxXp = Math.max(...stats.pastWeeks.map(w => w.xp));
              const percentage = (week.xp / maxXp) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: isCurrentWeek ? '#10b981' : '#cbd5e1' }}>
                      {week.week} {isCurrentWeek && '(Current)'}
                    </span>
                    <span style={{ fontWeight: '600', color: isCurrentWeek ? '#10b981' : '#94a3b8' }}>
                      {week.xp} XP
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: isCurrentWeek ? 'linear-gradient(to right, #10b981, #6366f1)' : 'linear-gradient(to right, #f59e0b, #ec4899)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="card" style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} /> Competition Tips
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>💡 Maintain a 7-day streak for the maximum +150 XP bonus</li>
            <li>🎯 Accept daily challenges to earn bonus XP</li>
            <li>📊 Track your weekly performance to beat past records</li>
            <li>🏃 Complete sessions efficiently to maximize daily XP</li>
            <li>🔥 Break your own records by increasing weekly totals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
