const SyllabusProgress = require('../models/SyllabusProgress.model');

// Full JEE/NEET syllabus
const SYLLABUS = {
  Physics: [
    'Units & Measurements', 'Motion in a Straight Line', 'Motion in a Plane',
    'Laws of Motion', 'Work, Energy & Power', 'System of Particles & Rotational Motion',
    'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids',
    'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory of Gases',
    'Oscillations', 'Waves', 'Electric Charges & Fields', 'Electrostatic Potential & Capacitance',
    'Current Electricity', 'Moving Charges & Magnetism', 'Magnetism & Matter',
    'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
    'Ray Optics & Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation & Matter',
    'Atoms', 'Nuclei', 'Semiconductor Electronics',
  ],
  Chemistry: [
    'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements & Periodicity',
    'Chemical Bonding & Molecular Structure', 'States of Matter', 'Thermodynamics',
    'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements',
    'p-Block Elements (Group 13-14)', 'p-Block Elements (Group 15-18)', 'Organic Chemistry Basics',
    'Hydrocarbons', 'Environmental Chemistry', 'Solid State', 'Solutions',
    'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'd & f Block Elements',
    'Coordination Compounds', 'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers',
    'Aldehydes, Ketones & Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers',
    'Chemistry in Everyday Life',
  ],
  Mathematics: [
    'Sets', 'Relations & Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction',
    'Complex Numbers & Quadratic Equations', 'Linear Inequalities', 'Permutations & Combinations',
    'Binomial Theorem', 'Sequences & Series', 'Straight Lines', 'Conic Sections',
    'Introduction to 3D Geometry', 'Limits & Derivatives', 'Mathematical Reasoning',
    'Statistics', 'Probability', 'Relations & Functions (XII)', 'Inverse Trigonometric Functions',
    'Matrices', 'Determinants', 'Continuity & Differentiability', 'Applications of Derivatives',
    'Integrals', 'Applications of Integrals', 'Differential Equations',
    'Vector Algebra', '3D Geometry (XII)', 'Linear Programming', 'Probability (XII)',
  ],
  Biology: [
    'The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom',
    'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals',
    'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle & Cell Division',
    'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis in Higher Plants',
    'Respiration in Plants', 'Plant Growth & Development', 'Digestion & Absorption',
    'Breathing & Exchange of Gases', 'Body Fluids & Circulation', 'Excretory Products & Elimination',
    'Locomotion & Movement', 'Neural Control & Coordination', 'Chemical Coordination & Integration',
    'Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants',
    'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance & Variation',
    'Molecular Basis of Inheritance', 'Evolution', 'Human Health & Disease',
    'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare',
    'Biotechnology: Principles & Processes', 'Biotechnology & Its Applications',
    'Organisms & Populations', 'Ecosystem', 'Biodiversity & Conservation',
    'Environmental Issues',
  ],
};

// GET /api/syllabus
const getSyllabus = async (req, res) => {
  const { subject } = req.query;

  // Get user's progress
  const filter = { userId: req.user._id };
  if (subject && subject !== 'all') filter.subject = subject;
  const progressRecords = await SyllabusProgress.find(filter);

  // Build response with full syllabus + user progress
  const subjects = subject && subject !== 'all' ? [subject] : Object.keys(SYLLABUS);
  const result = {};

  for (const sub of subjects) {
    if (!SYLLABUS[sub]) continue;
    result[sub] = SYLLABUS[sub].map(chapter => {
      const prog = progressRecords.find(p => p.subject === sub && p.chapter === chapter);
      return {
        chapter,
        status: prog?.status || 'not-started',
        confidence: prog?.confidence || 0,
        notes: prog?.notes || '',
        targetDate: prog?.targetDate || null,
        completedAt: prog?.completedAt || null,
      };
    });
  }

  // Calculate stats
  const stats = {};
  for (const sub of Object.keys(SYLLABUS)) {
    const total = SYLLABUS[sub].length;
    const prog = progressRecords.filter(p => p.subject === sub);
    const done = prog.filter(p => p.status === 'done').length;
    const revision = prog.filter(p => p.status === 'revision').length;
    const reading = prog.filter(p => p.status === 'reading').length;
    stats[sub] = { total, done, revision, reading, notStarted: total - done - revision - reading, pct: Math.round(((done + revision) / total) * 100) };
  }

  res.json({ success: true, data: result, stats, syllabus: SYLLABUS });
};

// PATCH /api/syllabus
const updateChapter = async (req, res) => {
  const { subject, chapter, status, confidence, notes, targetDate } = req.body;
  if (!subject || !chapter) return res.status(400).json({ success: false, message: 'subject and chapter required' });

  const update = { status, confidence };
  if (notes !== undefined) update.notes = notes;
  if (targetDate) update.targetDate = new Date(targetDate);
  if (status === 'done' || status === 'revision') update.completedAt = new Date();

  const prog = await SyllabusProgress.findOneAndUpdate(
    { userId: req.user._id, subject, chapter },
    { $set: update },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: prog });
};

// GET /api/syllabus/stats
const getStats = async (req, res) => {
  const progressRecords = await SyllabusProgress.find({ userId: req.user._id });
  const stats = {};
  let grandTotal = 0, grandDone = 0;

  for (const sub of Object.keys(SYLLABUS)) {
    const total = SYLLABUS[sub].length;
    const prog = progressRecords.filter(p => p.subject === sub);
    const done = prog.filter(p => p.status === 'done').length;
    const revision = prog.filter(p => p.status === 'revision').length;
    const reading = prog.filter(p => p.status === 'reading').length;
    grandTotal += total;
    grandDone += done + revision;
    stats[sub] = { total, done, revision, reading, notStarted: total - done - revision - reading, pct: Math.round(((done + revision) / total) * 100) };
  }

  res.json({
    success: true,
    data: stats,
    overall: { total: grandTotal, done: grandDone, pct: Math.round((grandDone / grandTotal) * 100) },
  });
};

module.exports = { getSyllabus, updateChapter, getStats, SYLLABUS };
