const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  estimatedMinutes: {
    type: Number,
    min: 0
  }
}, { _id: true });

const modeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activeMode: {
    type: String,
    required: true,
    enum: [
      'TASK_DECONSTRUCTOR',
      'DIGITAL_FRICTION',
      'DONE_OVER_PERFECT',
      'NOVELTY_INJECTION',
      'SINGLE_CONTEXT_LOCK',
      'NEXT_ACTION_CLARIFIER'
    ]
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  
  // Reference to IntendedTask (for Task Deconstructor)
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntendedTask'
  },
  
  // Task Deconstructor specific fields
  subTasks: [subTaskSchema],
  currentSubTaskIndex: {
    type: Number,
    default: 0
  },
  
  // Digital Friction specific fields
  distractionSessions: [{
    sessionId: mongoose.Schema.Types.ObjectId,
    category: String, // 'social', 'video', 'gaming', 'browsing'
    startedAt: Date,
    endedAt: Date,
    pauseCount: { type: Number, default: 0 },
    lastPauseDuration: { type: Number, default: 0 }, // in seconds
    totalTimeOnDistraction: Number // in seconds
  }],
  totalTimeRescued: { type: Number, default: 0 }, // in seconds
  
  // Generic settings object for mode-specific configuration
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for completion progress
modeSchema.virtual('progress').get(function() {
  if (!this.subTasks || this.subTasks.length === 0) return 0;
  const completed = this.subTasks.filter(st => st.completed).length;
  return Math.round((completed / this.subTasks.length) * 100);
});

// Method to complete a sub-task
modeSchema.methods.completeSubTask = function(subTaskId) {
  const subTask = this.subTasks.id(subTaskId);
  if (subTask && !subTask.completed) {
    subTask.completed = true;
    subTask.completedAt = new Date();
    
    // Auto-advance to next incomplete sub-task
    const nextIncompleteIndex = this.subTasks.findIndex(
      (st, idx) => idx > this.currentSubTaskIndex && !st.completed
    );
    if (nextIncompleteIndex !== -1) {
      this.currentSubTaskIndex = nextIncompleteIndex;
    }
    
    // Check if all sub-tasks completed
    const allCompleted = this.subTasks.every(st => st.completed);
    if (allCompleted) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  return this.save();
};

// Method to add sub-task
modeSchema.methods.addSubTask = function(text, estimatedMinutes = null) {
  this.subTasks.push({
    text,
    estimatedMinutes,
    completed: false
  });
  return this.save();
};

// Digital Friction specific methods
modeSchema.methods.recordDistractionSession = function(category, sessionId) {
  this.distractionSessions.push({
    sessionId,
    category,
    startedAt: new Date(),
    pauseCount: 0,
    lastPauseDuration: 10 // Start with 10 seconds
  });
  return this.save();
};

modeSchema.methods.recordFrictionPause = function(sessionId, durationSeconds) {
  const session = this.distractionSessions.find(s => 
    s.sessionId.toString() === sessionId.toString() && !s.endedAt
  );
  if (session) {
    session.pauseCount += 1;
    session.lastPauseDuration = Math.min(20, 10 + (session.pauseCount * 5)); // Escalate 10s → 15s → 20s
  }
  return this.save();
};

modeSchema.methods.endDistractionSession = function(sessionId, totalSeconds) {
  const session = this.distractionSessions.find(s => 
    s.sessionId.toString() === sessionId.toString() && !s.endedAt
  );
  if (session) {
    session.endedAt = new Date();
    session.totalTimeOnDistraction = totalSeconds;
    // Calculate time "rescued" as time that would have been spent without friction
    // Estimate: pauseCount * average pause duration * 2 (assumes pause helps refocus)
    const timeRescued = session.pauseCount * (session.lastPauseDuration / 1000) * 2;
    this.totalTimeRescued += timeRescued;
  }
  return this.save();
};

modeSchema.set('toJSON', { virtuals: true });
modeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mode', modeSchema);
