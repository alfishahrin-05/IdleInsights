import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trash2, Edit2, Save, Plus } from 'lucide-react';
import API from '../../services/api';

const TaskDeconstructorMode = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [editingSubTask, setEditingSubTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editMinutes, setEditMinutes] = useState('');

  useEffect(() => {
    fetchMode();
  }, [modeId]);

  const fetchMode = async () => {
    try {
      const response = await API.get('/modes/active');
      if (response.data && response.data._id === modeId) {
        setMode(response.data);
      } else {
        alert('Mode not found or inactive');
        navigate('/modes');
      }
    } catch (error) {
      console.error('Error fetching mode:', error);
      alert('Failed to load mode');
      navigate('/modes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskText.trim()) {
      alert('Please enter a sub-task description');
      return;
    }

    try {
      const response = await API.post(`/modes/${modeId}/subtasks`, {
        text: newSubTaskText.trim(),
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null
      });
      setMode(response.data);
      setNewSubTaskText('');
      setEstimatedMinutes('');
    } catch (error) {
      console.error('Error adding sub-task:', error);
      alert('Failed to add sub-task');
    }
  };

  const handleCompleteSubTask = async (subTaskId) => {
    try {
      const response = await API.post(`/modes/${modeId}/complete-subtask`, { subTaskId });
      setMode(response.data);
    } catch (error) {
      console.error('Error completing sub-task:', error);
      alert('Failed to complete sub-task');
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    if (!confirm('Delete this sub-task?')) return;

    try {
      const response = await API.delete(`/modes/${modeId}/subtasks`, {
        data: { subTaskId }
      });
      setMode(response.data);
    } catch (error) {
      console.error('Error deleting sub-task:', error);
      alert('Failed to delete sub-task');
    }
  };

  const handleEditSubTask = (subTask) => {
    setEditingSubTask(subTask._id);
    setEditText(subTask.text);
    setEditMinutes(subTask.estimatedMinutes || '');
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      alert('Sub-task cannot be empty');
      return;
    }

    try {
      const response = await API.patch(`/modes/${modeId}/subtasks`, {
        subTaskId: editingSubTask,
        text: editText.trim(),
        estimatedMinutes: editMinutes ? parseInt(editMinutes) : null
      });
      setMode(response.data);
      setEditingSubTask(null);
      setEditText('');
      setEditMinutes('');
    } catch (error) {
      console.error('Error updating sub-task:', error);
      alert('Failed to update sub-task');
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      await API.post(`/modes/${modeId}/save-template`);
      alert('Sub-tasks saved as template for this task!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate Task Deconstructor mode?')) return;

    try {
      await API.delete(`/modes/${modeId}`);
      navigate('/modes');
    } catch (error) {
      console.error('Error deactivating mode:', error);
      alert('Failed to deactivate mode');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!mode) return null;

  const completedCount = mode.subTasks.filter(st => st.completed).length;
  const totalCount = mode.subTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0 }}>🧩 Task Deconstructor Setup</h1>
            <button onClick={handleDeactivate} className="btn" style={{ backgroundColor: '#ef4444' }}>
              Deactivate Mode
            </button>
          </div>
          
          {/* Task Info */}
          <div className="card" style={{ backgroundColor: 'var(--color-primary)', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
              {mode.taskId?.title || 'Unknown Task'}
            </h2>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Difficulty: {mode.taskId?.difficulty}/5
            </p>
          </div>

          {/* Instructions */}
          <div className="card" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '1rem', border: '2px solid var(--color-success)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>💡 Setup Instructions:</h4>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <li>Break down your task into manageable sub-tasks below</li>
              <li>Optionally add estimated time for each sub-task</li>
              <li>Save as template for future reuse (optional)</li>
              <li>Go to <strong>Tasks page</strong> and start a session on this task</li>
              <li>Your sub-tasks will appear in a floating card during the session</li>
              <li>Timer will count down and notify you when time's up</li>
            </ol>
          </div>
        </div>

        {/* Add Sub-Task */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>
            {mode.subTasks.length === 0 
              ? "Let's break this down into smaller, manageable pieces"
              : "Add another step"}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {mode.subTasks.length === 0
              ? "What's a concrete action you can take to get started?"
              : "What comes next?"}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newSubTaskText}
              onChange={(e) => setNewSubTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubTask()}
              placeholder="e.g., Research JWT libraries, Write user schema..."
              style={{
                flex: 1,
                minWidth: '300px',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)'
              }}
            />
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="Est. min (optional)"
              style={{
                width: '140px',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)'
              }}
            />
            <button onClick={handleAddSubTask} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add
            </button>
          </div>
        </div>

        {/* Sub-Task List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Sub-Tasks ({totalCount})</h3>
            {mode.subTasks.length >= 2 && (
              <button onClick={handleSaveAsTemplate} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Save size={16} /> Save as Template
              </button>
            )}
          </div>

          {mode.subTasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              No sub-tasks yet. Add at least 2 to get started.
            </p>
          ) : (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px' }}>
                💡 Progress tracking will appear in a floating card when you start a session on this task
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mode.subTasks.map((subTask, index) => (
                <div
                  key={subTask._id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  {/* Number */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    {editingSubTask === subTask._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.5rem',
                            fontSize: '0.95rem',
                            borderRadius: '6px',
                            border: '2px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text)'
                          }}
                        />
                        <input
                          type="number"
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(e.target.value)}
                          placeholder="Minutes"
                          style={{
                            width: '100px',
                            padding: '0.5rem',
                            fontSize: '0.95rem',
                            borderRadius: '6px',
                            border: '2px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text)'
                          }}
                        />
                        <button onClick={handleSaveEdit} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                          Save
                        </button>
                        <button onClick={() => setEditingSubTask(null)} className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                          {subTask.text}
                        </div>
                        {subTask.estimatedMinutes && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Est. {subTask.estimatedMinutes} minutes
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingSubTask !== subTask._id && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditSubTask(subTask)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: 'var(--color-text-muted)',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubTask(subTask._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#ef4444',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/modes" className="btn">Back to Modes</Link>
        </div>
      </div>
    </div>
  );
};

export default TaskDeconstructorMode;
