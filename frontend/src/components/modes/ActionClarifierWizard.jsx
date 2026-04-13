import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ActionClarifierWizard = ({ onComplete, onCancel }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(searchParams.get('taskId') || '');
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    what: '',
    where: '',
    howToKnowDone: '',
    firstAction: ''
  });
  const [filter, setFilter] = useState('vague'); // 'vague' or 'all'
  const [actionSuggestions, setActionSuggestions] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t._id === selectedTaskId);
      if (task) {
        setSelectedTask(task);
        // Pre-fill form if clarification already exists
        if (task.clarificationDetails) {
          setFormData(task.clarificationDetails);
        }
        // Generate action suggestions based on task type
        generateActionSuggestions(task.title);
      }
    }
  }, [selectedTaskId, tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await API.get('/tasks');
      const filtered = filter === 'vague' 
        ? response.data.filter(t => t.isVague && t.status === 'active')
        : response.data.filter(t => t.status === 'active');
      setTasks(filtered);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActionSuggestions = (taskTitle) => {
    const lowerText = taskTitle.toLowerCase();
    
    let suggestions = [];
    if (lowerText.match(/code|develop|build|fix|bug|implement|create.*feature/)) {
      suggestions = ['Create new file', 'Write first function', 'Set up environment', 'Install dependencies', 'Write test', 'Review requirements', 'Design structure'];
    } else if (lowerText.match(/write|document|article|blog|email|letter/)) {
      suggestions = ['Write outline', 'Draft introduction', 'Gather sources', 'Brainstorm ideas', 'Edit first section', 'Add references', 'Write thesis'];
    } else if (lowerText.match(/design|ui|ux|layout|mockup|logo|banner/)) {
      suggestions = ['Create wireframe', 'Pick color palette', 'Set up canvas', 'Design component', 'Review design system', 'Create prototype', 'Gather inspiration'];
    } else if (lowerText.match(/research|survey|learn|study|prepare|analyze/)) {
      suggestions = ['Search online resources', 'Read article', 'Take notes', 'Create summary', 'Compile findings', 'Make comparison chart', 'Generate questions'];
    } else {
      suggestions = ['Make list', 'Gather resources', 'Set timer', 'Clear workspace', 'Plan approach', 'Get feedback', 'Break into steps'];
    }
    
    setActionSuggestions(suggestions);
  };

  const handleTaskSelect = (task) => {
    setSelectedTaskId(task._id);
    setSearchParams({ taskId: task._id });
    setStep(2);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActionSelect = (action) => {
    setFormData(prev => ({
      ...prev,
      firstAction: action
    }));
  };

  const handleNext = () => {
    if (step < 5) {
      // Validate current step
      if (step === 1 && !selectedTaskId) {
        alert('Please select a task');
        return;
      }
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTaskId) {
      alert('Task ID is missing. Please start over.');
      return;
    }

    if (!formData.what || !formData.where || !formData.howToKnowDone || !formData.firstAction) {
      alert('Please complete all fields');
      return;
    }

    try {
      setLoading(true);
      await API.put(`/tasks/${selectedTaskId}`, {
        clarificationDetails: formData,
        isVague: false
      });
      
      // Show success and call callback
      if (onComplete) {
        onComplete({
          taskId: selectedTaskId,
          details: formData
        });
      } else {
        alert('Task clarified successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving clarification:', error);
      alert('Failed to save task clarification');
    } finally {
      setLoading(false);
    }
  };

  // Progress bar
  const ProgressBar = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '0.5rem',
      marginBottom: '2rem'
    }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          style={{
            padding: '0.75rem 0.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: '600',
            borderRadius: '8px',
            backgroundColor: step >= s ? 'rgba(99, 102, 241, 0.3)' : 'rgba(148, 163, 184, 0.1)',
            color: step >= s ? '#6366f1' : '#94a3b8',
            border: step >= s ? '1px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.2)',
            transition: '0.3s'
          }}
        >
          {s === 1 && 'Select'}
          {s === 2 && 'What?'}
          {s === 3 && 'Where?'}
          {s === 4 && 'Done?'}
          {s === 5 && 'Action'}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '700px',
      margin: '0 auto'
    }}>
      <ProgressBar />

      {/* Step 1: Select Task */}
      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Step 1: Select a Task</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
              <input 
                type="radio" 
                name="filter" 
                value="vague" 
                checked={filter === 'vague'}
                onChange={(e) => setFilter(e.target.value)}
              /> Vague Tasks Only
            </label>
            <label>
              <input 
                type="radio" 
                name="filter" 
                value="all" 
                checked={filter === 'all'}
                onChange={(e) => setFilter(e.target.value)}
              /> All Active Tasks
            </label>
          </div>
          
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No {filter === 'vague' ? 'vague' : 'active'} tasks found. Create a task first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => handleTaskSelect(task)}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: selectedTaskId === task._id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.05)',
                    border: selectedTaskId === task._id ? '2px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.1)',
                    cursor: 'pointer',
                    transition: '0.3s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTaskId !== task._id) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTaskId !== task._id) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      {task.description.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Difficulty: {task.difficulty}/5
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: What? */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Step 2: What's the Tangible Output?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Describe exactly what you'll create, write, or build. (e.g., "3 unit tests", "500-word blog post")
          </p>
          {selectedTask && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
              <strong>Task:</strong> {selectedTask.title}
            </div>
          )}
          <textarea
            value={formData.what}
            onChange={(e) => handleFormChange('what', e.target.value)}
            placeholder="e.g., 'Complete the authentication API endpoint with error handling'"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Step 3: Where? */}
      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Step 3: Where Will You Work?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Specify the tool, file, or location. (e.g., "VS Code", "Google Docs", "The Library")
          </p>
          <input
            type="text"
            value={formData.where}
            onChange={(e) => handleFormChange('where', e.target.value)}
            placeholder="e.g., 'VS Code - /src/api/auth.js'"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          />
        </div>
      )}

      {/* Step 4: How to Know Done? */}
      {step === 4 && (
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Step 4: How Will You Know You're Done?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Define completion criteria. (e.g., "Code compiles without errors", "Peer review passed")
          </p>
          <textarea
            value={formData.howToKnowDone}
            onChange={(e) => handleFormChange('howToKnowDone', e.target.value)}
            placeholder="e.g., 'All unit tests pass (5/5 green)'"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Step 5: First Action */}
      {step === 5 && (
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Step 5: What's Your First Action?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Define a concrete, verb-driven action you can start right now (15 min or less)
          </p>
          
          {actionSuggestions.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>
                Quick Suggestions:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {actionSuggestions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActionSelect(action)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: formData.firstAction === action ? '#6366f1' : 'rgba(99, 102, 241, 0.1)',
                      color: formData.firstAction === action ? '#e2e8f0' : '#94a3b8',
                      border: formData.firstAction === action ? '1px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.2)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: '0.3s'
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <textarea
            value={formData.firstAction}
            onChange={(e) => handleFormChange('firstAction', e.target.value)}
            placeholder="e.g., 'Open VS Code and create auth-middleware.js file'"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'space-between',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => step > 1 ? setStep(step - 1) : onCancel && onCancel()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ChevronLeft size={18} /> {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 5 && (
          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        )}

        {step === 5 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: loading ? '#64748b' : '#10b981',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save & Complete'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionClarifierWizard;
