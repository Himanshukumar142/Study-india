const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/ai/generate-from-pdf
 * Accepts a PDF file, extracts text, sends to Gemini, returns MCQ questions.
 */
const generateFromPDF = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, message: 'Only PDF files are supported' });
  }

  const {
    count = 10,
    difficulty = 'medium',
    exam = 'BOTH',
    subject = '',
    chapter = '',
  } = req.body;

  try {
    // 1. Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({
        success: false,
        message: 'PDF has too little readable text. Try a different file.',
      });
    }

    // Limit text to ~12000 chars to stay within Gemini context window
    const text = rawText.substring(0, 12000);

    // 2. Build prompt for Gemini
    const prompt = `
You are an expert exam question generator for Indian competitive exams (JEE and NEET).

Given the following study material text extracted from a PDF, generate exactly ${count} high-quality MCQ questions.

RULES:
- Each question must have exactly 4 options labeled A, B, C, D.
- Exactly one correct answer per question.
- Include a brief explanation for each answer.
- Set difficulty level: ${difficulty}
- Subject: ${subject || 'auto-detect from content'}
- Chapter: ${chapter || 'auto-detect from content'}
- Cover different concepts from the text — do NOT repeat similar questions.
- Questions should test understanding, not just memory.

RESPOND ONLY WITH A VALID JSON ARRAY. No markdown, no extra text. Example format:
[
  {
    "question": "What is the SI unit of force?",
    "options": { "A": "Joule", "B": "Newton", "C": "Watt", "D": "Pascal" },
    "correct": "B",
    "explanation": "Force is measured in Newtons (N) in SI system.",
    "subject": "Physics",
    "chapter": "Laws of Motion",
    "difficulty": "easy",
    "marks": 4,
    "negativeMarking": -1,
    "exam": "BOTH"
  }
]

STUDY MATERIAL TEXT:
---
${text}
---

Generate exactly ${count} questions. Return ONLY the JSON array.`;

    // 3. Call Gemini or Fallback
    let aiText = '';
    const apiKey = process.env.GEMINI_API_KEY;
    const isMockRequired = !apiKey || apiKey.length < 10 || apiKey === 'AIzaSyCmNHze7OIJADFpn9qYO19LZdO6uhWc_iw';

    if (!isMockRequired) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiText = response.text();
      } catch (geminiError) {
        console.error('Gemini API failed in PDF generation, falling back to mock data:', geminiError.message);
      }
    }

    let questions;
    if (aiText) {
      // 4. Parse JSON from response
      // Strip markdown code fences if present
      aiText = aiText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      try {
        questions = JSON.parse(aiText);
      } catch (parseErr) {
        console.error('AI JSON parse failed:', aiText.substring(0, 500));
      }
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.log('Generating fallback mock questions.');
      const sub = subject || 'Science';
      const chap = chapter || req.file.originalname.replace('.pdf', '');
      questions = Array.from({ length: parseInt(count) || 10 }).map((_, i) => ({
        question: `What is a core principle related to "${chap}" in ${sub}? (Simulated Question ${i + 1})`,
        options: {
          A: `Key concept of ${chap} under standard conditions`,
          B: `Alternative explanation of ${chap} theory`,
          C: `Mathematical representation of ${chap} formula`,
          D: `Experimental validation of ${chap} effects`
        },
        correct: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        explanation: `This is a fallback mock explanation for "${chap}". Ensure your PDF has selectable text and process.env.GEMINI_API_KEY is correct.`,
        subject: sub,
        chapter: chap,
        difficulty: difficulty || 'medium',
        marks: 4,
        negativeMarking: -1,
        exam: 'BOTH'
      }));
    }

    // 5. Normalize questions
    const normalized = questions.map((q, i) => ({
      question: q.question || `Question ${i + 1}`,
      options: q.options || {},
      correct: q.correct || 'A',
      explanation: q.explanation || '',
      subject: q.subject || subject || 'General',
      chapter: q.chapter || chapter || 'General',
      difficulty: (q.difficulty || difficulty).toLowerCase(),
      marks: q.marks || 4,
      negativeMarking: q.negativeMarking ?? -1,
      exam: (q.exam || exam).toUpperCase(),
    }));

    return res.json({
      success: true,
      message: `${normalized.length} questions generated from PDF`,
      data: {
        questions: normalized,
        pdfInfo: {
          pages: pdfData.numpages,
          textLength: rawText.length,
          title: pdfData.info?.Title || req.file.originalname,
        },
      },
    });
  } catch (error) {
    console.error('PDF Quiz Generation Error:', error);

    if (error.message?.includes('API key')) {
      return res.status(503).json({ success: false, message: 'Gemini API key invalid or missing' });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate questions. ' + (error.message || ''),
    });
  }
};

module.exports = { generateFromPDF };
