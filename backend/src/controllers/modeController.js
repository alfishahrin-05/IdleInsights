const Mode = require('../models/Mode');
const IntendedTask = require('../models/IntendedTask');

// Get active mode for user
exports.getActiveMode = async (req, res) => {
  try {
    const activeMode = await Mode.findOne({
      userId: req.user._id,
      status: 'active'
    }).populate('taskId');

    res.json(activeMode);
  } catch (error) {
    console.error('Get active mode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activate a new mode
exports.activateMode = async (req, res) => {
  try {
    const { activeMode, taskId, settings } = req.body;

    // Deactivate any existing active modes
    await Mode.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'paused', completedAt: new Date() }
    );

    // Validate taskId if provided (for Task Deconstructor)
    if (taskId) {
      const task = await IntendedTask.findOne({ _id: taskId, userId: req.user._id });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    // Create new mode instance
    const mode = new Mode({
      userId: req.user._id,
      activeMode,
      taskId,
      settings: settings || {},
      status: 'active'
    });

    // Load sub-task template if exists (for Task Deconstructor)
    if (activeMode === 'TASK_DECONSTRUCTOR' && taskId) {
      const task = await IntendedTask.findById(taskId);
      if (task.subTaskTemplate && task.subTaskTemplate.length > 0) {
        mode.subTasks = task.subTaskTemplate.map(template => ({
          text: template.text,
          estimatedMinutes: template.estimatedMinutes,
          completed: false
        }));
      }
    }

    await mode.save();
    await mode.populate('taskId');

    res.status(201).json(mode);
  } catch (error) {
    console.error('Activate mode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mode settings
exports.updateModeSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!mode) {
      return res.status(404).json({ message: 'Mode not found' });
    }

    mode.settings = { ...mode.settings, ...settings };
    await mode.save();
    await mode.populate('taskId');

    res.json(mode);
  } catch (error) {
    console.error('Update mode settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add sub-task to mode
exports.addSubTask = async (req, res) => {
  try {
    const { text, estimatedMinutes } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    await mode.addSubTask(text, estimatedMinutes);
    await mode.populate('taskId');

    res.json(mode);
  } catch (error) {
    console.error('Add sub-task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update sub-task (edit text or estimated time)
exports.updateSubTask = async (req, res) => {
  try {
    const { subTaskId, text, estimatedMinutes } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    const subTask = mode.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: 'Sub-task not found' });
    }

    if (text !== undefined) subTask.text = text;
    if (estimatedMinutes !== undefined) subTask.estimatedMinutes = estimatedMinutes;

    await mode.save();
    await mode.populate('taskId');

    res.json(mode);
  } catch (error) {
    console.error('Update sub-task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete sub-task
exports.deleteSubTask = async (req, res) => {
  try {
    const { subTaskId } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    mode.subTasks.pull(subTaskId);
    await mode.save();
    await mode.populate('taskId');

    res.json(mode);
  } catch (error) {
    console.error('Delete sub-task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete a sub-task
exports.completeSubTask = async (req, res) => {
  try {
    const { subTaskId } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    await mode.completeSubTask(subTaskId);
    await mode.populate('taskId');

    res.json(mode);
  } catch (error) {
    console.error('Complete sub-task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Save sub-tasks as template to IntendedTask
exports.saveAsTemplate = async (req, res) => {
  try {
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!mode || !mode.taskId) {
      return res.status(404).json({ message: 'Mode or task not found' });
    }

    const task = await IntendedTask.findOne({
      _id: mode.taskId,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Save current sub-tasks as template
    task.subTaskTemplate = mode.subTasks.map(st => ({
      text: st.text,
      estimatedMinutes: st.estimatedMinutes
    }));

    await task.save();

    res.json({ message: 'Template saved successfully', task });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Deactivate mode
exports.deactivateMode = async (req, res) => {
  try {
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    mode.status = 'paused';
    mode.completedAt = new Date();
    await mode.save();

    res.json({ message: 'Mode deactivated' });
  } catch (error) {
    console.error('Deactivate mode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Digital Friction: Start distraction session
exports.startDistractionSession = async (req, res) => {
  try {
    const { category, sessionId } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    await mode.recordDistractionSession(category, sessionId);
    res.json(mode);
  } catch (error) {
    console.error('Start distraction session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Digital Friction: End distraction session
exports.endDistractionSession = async (req, res) => {
  try {
    const { sessionId, totalSeconds } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    await mode.endDistractionSession(sessionId, totalSeconds);
    res.json(mode);
  } catch (error) {
    console.error('End distraction session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Digital Friction: Record friction pause
exports.recordFrictionPause = async (req, res) => {
  try {
    const { sessionId, durationSeconds } = req.body;
    const mode = await Mode.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });

    if (!mode) {
      return res.status(404).json({ message: 'Active mode not found' });
    }

    await mode.recordFrictionPause(sessionId, durationSeconds);
    res.json(mode);
  } catch (error) {
    console.error('Record friction pause error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
