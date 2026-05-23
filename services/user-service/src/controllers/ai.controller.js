const { GoogleGenerativeAI } = require("@google/generative-ai");
const QuizAttempt = require("../models/QuizAttempt.model");
const Question = require("../models/Question.model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithAI = async (req, res) => {
  const { message, attemptId, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let context = "";

    // 1. Check if user is asking to explain a specific question
    const explainMatch = message.toLowerCase().match(/explain question (\d+)/i);
    
    if (explainMatch && attemptId) {
      const questionNum = parseInt(explainMatch[1]);
      const attempt = await QuizAttempt.findById(attemptId).populate("questions");
      
      if (attempt && attempt.questions[questionNum - 1]) {
        const q = attempt.questions[questionNum - 1];
        const userAns = attempt.answers.find(a => a.questionId.toString() === q._id.toString());
        
        context = `
          The user is asking about Question ${questionNum} from their quiz.
          Question: ${q.question}
          Options: ${JSON.stringify(q.options)}
          Correct Answer: ${q.correct}
          Explanation provided in DB: ${q.explanation}
          User's Answer: ${userAns ? userAns.selectedOption : 'Not answered'}
          Is User Correct: ${userAns ? userAns.isCorrect : 'N/A'}
          
          Please explain this question briefly and point-by-point from the absolute origin/basics.
        `;
      }
    }

    const prompt = `
      You are "Antigravity AI", a brilliant and encouraging mentor for JEE and NEET aspirants. 
      Your goal is to simplify complex concepts and help students excel.
      
      Guidelines:
      - Be concise but thorough.
      - Use point-by-point formatting.
      - Explain from the "origin" (fundamental concepts) so even a beginner understands.
      - Use a friendly, professional, and motivating tone.
      - If explaining a question, clarify WHY the correct option is right and WHY others are wrong if relevant.
      
      ${context ? `CONTEXT: ${context}` : ""}
      
      USER MESSAGE: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, message: "AI is currently unavailable. Check API Key." });
  }
};

module.exports = { chatWithAI };
