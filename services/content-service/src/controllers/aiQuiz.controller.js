const { GoogleGenerativeAI } = require('@google/generative-ai');
const Question = require('../models/Question.model');
const QuizAttempt = require('../models/QuizAttempt.model');

/**
 * POST /api/ai/topic-quiz/start
 * Generates fresh MCQs via Gemini for a specific subject+chapter,
 * saves them to the Question collection, and creates a QuizAttempt.
 */
const startTopicQuiz = async (req, res) => {
  const { subject, chapter, mode = 'practice', limit = 10 } = req.body;

  if (!subject || !chapter) {
    return res.status(422).json({ success: false, message: 'Subject and chapter are required' });
  }

  const count = Math.min(parseInt(limit) || 10, 20);

  const prompt = `You are an elite question setter for Indian competitive exams (JEE Main, JEE Advanced, NEET UG).

Generate exactly ${count} unique, high-quality MCQ questions on the topic:
Subject: ${subject}
Chapter/Topic: ${chapter}

STRICT RULES:
1. Each question must have EXACTLY 4 options labeled A, B, C, D.
2. Only ONE correct answer per question.
3. Questions must test DEEP conceptual understanding — NOT just memorization.
4. Cover DIFFERENT concepts within ${chapter} — NO repetition of similar questions.
5. Mix difficulty: roughly 30% easy, 50% medium, 20% hard.
6. Include a clear, concise explanation for each answer.
7. Questions must be exam-relevant (JEE/NEET standard).
8. Use proper scientific notation and units where applicable.

RESPOND ONLY WITH A VALID JSON ARRAY. No markdown, no extra text:
[
  {
    "question": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correct": "B",
    "explanation": "...",
    "difficulty": "medium",
    "topic": "${chapter}"
  }
]

Generate exactly ${count} questions now:`;

  try {
    let attempt = await QuizAttempt.findOne({
      userId: req.user._id,
      subject,
      chapter,
      status: 'in-progress'
    });

    let savedQuestions;

    if (attempt) {
      // Resume existing in-progress quiz attempt
      const fetched = await Question.find({ _id: { $in: attempt.questions } });
      const qMap = {};
      fetched.forEach(q => { qMap[q._id.toString()] = q; });
      savedQuestions = attempt.questions.map(qid => qMap[qid.toString()]).filter(Boolean);
    } else {
      // Otherwise generate new set via AI
      let aiText = '';
      const apiKey = process.env.GEMINI_API_KEY;
      const isMockRequired = !apiKey || apiKey.length < 10 || apiKey === 'AIzaSyCmNHze7OIJADFpn9qYO19LZdO6uhWc_iw';

      if (!isMockRequired) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent(prompt);
          aiText = result.response.text().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        } catch (geminiError) {
          console.error('Gemini API failed, falling back to mock data:', geminiError.message);
        }
      }

      if (!aiText) {
        console.log('Using mock AI questions because API key is missing or invalid.');
        const mockQs = Array.from({ length: count }).map((_, i) => ({
          question: `(Mock) What is a key concept in ${subject} - ${chapter}? (Question ${i + 1})`,
          options: {
            A: `First concept related to ${chapter}`,
            B: `Second concept related to ${chapter}`,
            C: `Third concept related to ${chapter}`,
            D: `Fourth concept related to ${chapter}`
          },
          correct: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
          explanation: `This is a simulated explanation for ${chapter}. Please add a valid Gemini API key to .env for real AI generation.`,
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          topic: chapter
        }));
        aiText = JSON.stringify(mockQs);
      }

      let rawQuestions;
      try {
        rawQuestions = JSON.parse(aiText);
      } catch {
        const match = aiText.match(/\[[\s\S]*\]/);
        if (!match) return res.status(502).json({ success: false, message: 'AI returned invalid response. Please try again.' });
        rawQuestions = JSON.parse(match[0]);
      }

      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        return res.status(502).json({ success: false, message: 'AI returned no questions. Please try again.' });
      }

      const normalized = rawQuestions.slice(0, count).map((q) => ({
        question: q.question || 'Question unavailable',
        options: q.options || { A: '', B: '', C: '', D: '' },
        correct: (q.correct || 'A').toUpperCase().trim(),
        explanation: q.explanation || '',
        subject,
        chapter,
        topic: q.topic || chapter,
        difficulty: (q.difficulty || 'medium').toLowerCase(),
        marks: 4,
        negativeMarking: mode === 'practice' ? 0 : -1,
        exam: 'BOTH',
        createdBy: req.user._id,
        aiGenerated: true,
      }));

      savedQuestions = await Question.insertMany(normalized);
      const questionIds = savedQuestions.map((q) => q._id);

      attempt = await QuizAttempt.create({
        userId: req.user._id,
        subject,
        chapter,
        questions: questionIds,
        answers: questionIds.map((qid) => ({ questionId: qid })),
        mode,
        status: 'in-progress',
        startTime: new Date(),
      });
    }

    // Return questions WITHOUT correct answers
    const safeQuestions = savedQuestions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarking: q.negativeMarking,
    }));

    return res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        questions: safeQuestions,
        startTime: attempt.startTime,
        aiGenerated: !attempt.createdAt, // true if newly created in this call
        answers: attempt.answers
      },
    });
  } catch (err) {
    console.error('AI Topic Quiz Error:', err);
    if (err.message?.includes('API key')) {
      return res.status(503).json({ success: false, message: 'Gemini API key is invalid or missing.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to generate questions: ' + err.message });
  }
};

module.exports = { startTopicQuiz };
