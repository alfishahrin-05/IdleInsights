const IntendedTask = require('../models/IntendedTask');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        // Filter by status if provided, defaults to all if not specified (or usually active)
        // The requirement said "active tasks" for dropdown, likely.

        // If query ?status=active provided
        const filter = { userId: req.userId };
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const tasks = await IntendedTask.find(filter).sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, difficulty } = req.body;

        if (!title || !difficulty) {
            return res.status(400).json({ message: 'Please add title and difficulty' });
        }

        if (difficulty < 1 || difficulty > 5) {
            return res.status(400).json({ message: 'Difficulty must be between 1 and 5' });
        }

        const task = await IntendedTask.create({
            userId: req.userId,
            title,
            difficulty
        });

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await IntendedTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check for user
        if (task.userId.toString() !== req.userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedTask = await IntendedTask.findByIdAndUpdate(
            req.params.id,
            req.body, // { title, difficulty, status }
            { new: true }
        );

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await IntendedTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check for user
        if (task.userId.toString() !== req.userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await task.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
};
