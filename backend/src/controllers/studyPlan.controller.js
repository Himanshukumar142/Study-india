const StudyPlan = require('../models/StudyPlan.model');

const getToday = () => new Date().toISOString().split('T')[0];

// GET /api/study-plan?date=2025-05-07
const getPlan = async (req, res) => {
  const date = req.query.date || getToday();
  let plan = await StudyPlan.findOne({ userId: req.user._id, date });
  if (!plan) plan = { date, tasks: [], totalPlanned: 0, totalCompleted: 0, note: '' };
  res.json({ success: true, data: plan });
};

// GET /api/study-plan/week
const getWeekPlans = async (req, res) => {
  const today = new Date();
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const plans = await StudyPlan.find({ userId: req.user._id, date: { $in: dates } });
  const mapped = dates.map(d => plans.find(p => p.date === d) || { date: d, tasks: [], totalPlanned: 0, totalCompleted: 0 });
  res.json({ success: true, data: mapped });
};

// POST /api/study-plan
const savePlan = async (req, res) => {
  const { date, tasks, note } = req.body;
  const d = date || getToday();
  const totalPlanned = tasks.reduce((s, t) => s + (t.duration || 0), 0);
  const totalCompleted = tasks.filter(t => t.completed).reduce((s, t) => s + (t.duration || 0), 0);

  const plan = await StudyPlan.findOneAndUpdate(
    { userId: req.user._id, date: d },
    { tasks, totalPlanned, totalCompleted, note: note || '' },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: plan });
};

// PATCH /api/study-plan/task/:taskIndex
const toggleTask = async (req, res) => {
  const { date } = req.body;
  const d = date || getToday();
  const plan = await StudyPlan.findOne({ userId: req.user._id, date: d });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

  const idx = parseInt(req.params.taskIndex);
  if (!plan.tasks[idx]) return res.status(404).json({ success: false, message: 'Task not found' });

  plan.tasks[idx].completed = !plan.tasks[idx].completed;
  plan.tasks[idx].completedAt = plan.tasks[idx].completed ? new Date() : null;
  plan.totalCompleted = plan.tasks.filter(t => t.completed).reduce((s, t) => s + (t.duration || 0), 0);
  await plan.save();

  res.json({ success: true, data: plan });
};

// DELETE /api/study-plan/task/:taskIndex
const deleteTask = async (req, res) => {
  const { date } = req.body;
  const d = date || getToday();
  const plan = await StudyPlan.findOne({ userId: req.user._id, date: d });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

  plan.tasks.splice(parseInt(req.params.taskIndex), 1);
  plan.totalPlanned = plan.tasks.reduce((s, t) => s + (t.duration || 0), 0);
  plan.totalCompleted = plan.tasks.filter(t => t.completed).reduce((s, t) => s + (t.duration || 0), 0);
  await plan.save();

  res.json({ success: true, data: plan });
};

module.exports = { getPlan, getWeekPlans, savePlan, toggleTask, deleteTask };
