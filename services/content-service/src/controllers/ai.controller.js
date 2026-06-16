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

    let text = "";
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Attempting AI response using model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        if (text) {
          console.log(`✅ AI response successfully generated using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!text) {
      console.warn("⚠️ All Gemini models failed. Falling back to database/mock explanation.");
      
      const explainMatch = message.toLowerCase().match(/explain question (\d+)/i);
      if (explainMatch && attemptId) {
        const questionNum = parseInt(explainMatch[1]);
        const attempt = await QuizAttempt.findById(attemptId).populate("questions");
        
        if (attempt && attempt.questions[questionNum - 1]) {
          const q = attempt.questions[questionNum - 1];
          const userAns = attempt.answers.find(a => a.questionId.toString() === q._id.toString());
          
          let explanationText = `### 📚 Fallback Explanation for Question ${questionNum}\n\n`;
          explanationText += `**Question:**\n> ${q.question}\n\n`;
          
          explanationText += `**Options:**\n`;
          if (q.options) {
            Object.entries(q.options).forEach(([key, val]) => {
              if (val) {
                explanationText += `- **Option ${key}:** ${val}\n`;
              }
            });
          }
          explanationText += `\n`;
          
          explanationText += `**Correct Answer:** Option **${q.correct}**\n\n`;
          explanationText += `**Your Answer:** ${userAns ? `Option **${userAns.selectedOption || 'Not answered'}**` : 'Not answered'}\n`;
          explanationText += `**Result:** ${userAns ? (userAns.isCorrect ? '✅ Correct' : '❌ Incorrect') : 'N/A'}\n\n`;
          
          explanationText += `---\n\n`;
          explanationText += `### 💡 Detailed Solution:\n`;
          if (q.explanation) {
            explanationText += `${q.explanation}\n\n`;
          } else {
            explanationText += `*No detailed explanation was found in the database. Please review the core concept for "${attempt.chapter || 'this topic'}".*\n\n`;
          }
          
          explanationText += `\n*Note: This is a local database fallback. The live AI Doubt Solver is currently unavailable (please verify the API Key in the server configuration).*`;
          text = explanationText;
        }
      }
      
      if (!text) {
        text = `### 🤖 Antigravity AI (Fallback Mode)\n\nHello! I am your JEE/NEET study mentor. Currently, the live AI Connection is offline. Here are some quick study tips for your prep:\n\n` +
          `1. **Practice Regularly:** Daily consistency is the single most important factor for success in JEE & NEET.\n` +
          `2. **Review Mistakes:** Analyze every incorrect answer carefully to understand where your logic faltered.\n` +
          `3. **Master the Basics:** Make sure your fundamentals in physics, chemistry, and biology/math are solid before jumping to advanced problems.\n\n` +
          `*Note: To resolve this error and enable live AI chat, please ask your administrator to configure a valid \`GEMINI_API_KEY\` in the \`.env\` file.*`;
      }
    }

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, message: "AI is currently unavailable. Check API Key." });
  }
};

module.exports = { chatWithAI };
