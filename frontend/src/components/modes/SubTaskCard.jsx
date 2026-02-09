import { CheckCircle, Clock, ChevronRight, PartyPopper } from 'lucide-react';
import { useSessionContext } from '../../contexts/SessionContext';

const SubTaskCard = () => {
  const { 
    activeMode, 
    subTaskElapsedSeconds, 
    showSubTaskPrompt, 
    setShowSubTaskPrompt,
    showAllTasksCompletePrompt,
    setShowAllTasksCompletePrompt,
    completeSubTask,
    endSession
  } = useSessionContext();

  if (!activeMode || activeMode.activeMode !== 'TASK_DECONSTRUCTOR') return null;

  const currentSubTask = activeMode.subTasks?.[activeMode.currentSubTaskIndex];
  if (!currentSubTask || currentSubTask.completed) return null;

  const estimatedSeconds = currentSubTask.estimatedMinutes ? currentSubTask.estimatedMinutes * 60 : null;
  const isOverTime = estimatedSeconds && subTaskElapsedSeconds > estimatedSeconds;
  const remainingSeconds = estimatedSeconds ? (estimatedSeconds - subTaskElapsedSeconds) : null;
  const overtimeSeconds = isOverTime ? (subTaskElapsedSeconds - estimatedSeconds) : 0;
  const displaySeconds = isOverTime ? overtimeSeconds : remainingSeconds;
  const progress = estimatedSeconds ? Math.min(100, (subTaskElapsedSeconds / estimatedSeconds) * 100) : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '+' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = activeMode.subTasks.filter(st => st.completed).length;
  const totalCount = activeMode.subTasks.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleComplete = async () => {
    await completeSubTask(currentSubTask._id);
  };

  const handlePromptResponse = async (completed) => {
    if (completed) {
      await completeSubTask(currentSubTask._id);
    } else {
      setShowSubTaskPrompt(false);
      // Keep timer running
    }
  };

  const handleAllTasksCompleteResponse = async (shouldEnd) => {
    if (shouldEnd) {
      try {
        await endSession();
        setShowAllTasksCompletePrompt(false);
      } catch (error) {
        console.error('Failed to end session:', error);
        alert('Failed to end session');
      }
    } else {
      setShowAllTasksCompletePrompt(false);
    }
  };

  return (
    <>
      {/* Sub-Task Card */}
      <div 
        className="card" 
        style={{
          position: 'fixed',
          top: '5rem',
          right: '2rem',
          width: '380px',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
          border: '2px solid var(--color-primary)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 999,
          overflow: 'hidden'
        }}
      >
        {/* Progress bar background */}
        {estimatedSeconds && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress}%`,
              background: isOverTime 
                ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
                : 'linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.2))',
              transition: 'width 0.5s ease',
              zIndex: 0
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  🧩 Task Deconstructor • {activeMode.currentSubTaskIndex + 1}/{totalCount}
                </span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  color: 'var(--color-primary)',
                  padding: '0.15rem 0.5rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px'
                }}>
                  {overallProgress}%
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
                {currentSubTask.text}
              </h4>
            </div>
            <button
              onClick={handleComplete}
              className="btn btn-primary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginLeft: '0.5rem'
              }}
            >
              <CheckCircle size={14} /> Done
            </button>
          </div>

          {/* Timer display */}
          {estimatedSeconds && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: isOverTime ? '#ef4444' : 'var(--color-text-muted)' }} />
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 500,
                  color: isOverTime ? '#ef4444' : 'var(--color-text)'
                }}>
                  {isOverTime ? 'Over by' : 'Remaining'}: {formatTime(displaySeconds)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Est. {currentSubTask.estimatedMinutes} min
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            ✓ {completedCount} • ⏳ {totalCount - completedCount}
          </div>
        </div>
      </div>

      {/* Time-up prompt modal */}
      {showSubTaskPrompt && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowSubTaskPrompt(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              padding: '2rem',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Time's Up!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Your estimated time for this sub-task has elapsed.
            </p>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                Sub-task {activeMode.currentSubTaskIndex + 1}:
              </div>
              <div style={{ fontWeight: 500 }}>
                {currentSubTask.text}
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}>Did you complete this sub-task?</h4>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handlePromptResponse(true)}
                className="btn btn-primary"
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle size={18} /> Yes, Complete It
              </button>
              <button
                onClick={() => handlePromptResponse(false)}
                className="btn"
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ChevronRight size={18} /> No, Keep Working
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1rem', marginBottom: 0 }}>
              You can also manually complete it anytime from the card above
            </p>
          </div>
        </div>
      )}

      {/* All Tasks Complete Prompt */}
      {showAllTasksCompletePrompt && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowAllTasksCompletePrompt(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              padding: '2rem',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>All Sub-Tasks Complete!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Congratulations! You've completed all sub-tasks for this task.
            </p>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'left',
              border: '2px solid var(--color-success)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Task breakdown completed:
              </div>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                {activeMode.taskId?.title}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}>
                ✓ {totalCount} sub-tasks completed
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}>Would you like to end this session?</h4>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleAllTasksCompleteResponse(true)}
                className="btn btn-primary"
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle size={18} /> Yes, End Session
              </button>
              <button
                onClick={() => handleAllTasksCompleteResponse(false)}
                className="btn"
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ChevronRight size={18} /> Continue Working
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1rem', marginBottom: 0 }}>
              You can manually end the session anytime
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SubTaskCard;
