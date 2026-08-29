import {
  AIService,
  AnswerEvaluationRequest,
  AnswerEvaluationResponse,
  GeneratedStudySession,
  StudyMode,
} from './types';

export class MockAIService implements AIService {
  async summarizeDocument(documentText: string, filename: string): Promise<string> {
    const wordCount = documentText.split(/\s+/).length;
    const preview = documentText.slice(0, 250).replace(/\n/g, ' ');
    return `[Demo Summary for ${filename}]: This study material covers ${wordCount} words focused on foundational concepts. Key takeaway: "${preview}..."`;
  }

  async generateStudySession(
    documentTitle: string,
    topic: string,
    mode: StudyMode,
    relevantChunks: { chunkIndex: number; content: string }[]
  ): Promise<GeneratedStudySession> {
    const chunk0 = relevantChunks[0]?.content || 'Study document core principles and methodologies.';
    const chunk1 = relevantChunks[1]?.content || chunk0;

    const sampleTopic = topic && topic.trim() !== '' ? topic : 'Core Concepts';

    return {
      title: `Study Session: ${sampleTopic} (${mode} Mode)`,
      overview: `This study session is grounded in your uploaded document "${documentTitle}". It breaks down key principles of ${sampleTopic} using Bloom's Taxonomy progression.`,
      simplifiedExplanation: `Think of ${sampleTopic} as a structured set of rules and practices. Based on your notes: "${chunk0.slice(0, 180)}..."`,
      keyConcepts: [
        `${sampleTopic} Fundamentals`,
        `Core Principles & Definitions`,
        `Practical Application & Workflows`,
        `Analysis & Decision Making`,
      ],
      questions: [
        {
          bloomLevel: 'REMEMBER',
          questionType: 'MULTIPLE_CHOICE',
          content: `According to your study material, which statement best defines the core principle of ${sampleTopic}?`,
          options: [
            `A structured approach derived from document content: "${chunk0.slice(0, 50)}..."`,
            `An unrelated external algorithm with no document context`,
            `A temporary placeholder concept`,
            `An arbitrary process with no defined steps`,
          ],
          expectedAnswer: `A structured approach derived from document content: "${chunk0.slice(0, 50)}..."`,
          explanation: `This definition is explicitly stated in Chunk 0 of your uploaded document.`,
          sourceChunkReferences: [`Chunk ${relevantChunks[0]?.chunkIndex ?? 0}`],
        },
        {
          bloomLevel: 'UNDERSTAND',
          questionType: 'SHORT_ANSWER',
          content: `Explain in your own words how ${sampleTopic} functions based on the provided material.`,
          expectedAnswer: `The student should highlight key principles: ${chunk0.slice(0, 100)}`,
          explanation: `Understanding requires summarizing the relationship between concepts found in Chunk 0 and Chunk 1.`,
          sourceChunkReferences: [`Chunk ${relevantChunks[0]?.chunkIndex ?? 0}`],
        },
        {
          bloomLevel: 'APPLY',
          questionType: 'SCENARIO',
          content: `Scenario: You are tasked with applying ${sampleTopic} in a real-world scenario. What initial step should you execute first?`,
          expectedAnswer: `Apply the core methodology outlined in the document text: ${chunk1.slice(0, 80)}`,
          explanation: `Applying knowledge involves executing defined steps to solve real problems.`,
          sourceChunkReferences: [`Chunk ${relevantChunks[1]?.chunkIndex ?? 0}`],
        },
        {
          bloomLevel: 'ANALYZE',
          questionType: 'TROUBLESHOOTING',
          content: `Troubleshooting: Suppose a process involving ${sampleTopic} fails during execution. Analyze the primary bottleneck based on your study material.`,
          expectedAnswer: `Analyze the divergence between expected execution and actual constraints in the document text.`,
          explanation: `Analysis examines component relationships and identifies root causes.`,
          sourceChunkReferences: [`Chunk ${relevantChunks[0]?.chunkIndex ?? 0}`],
        },
        {
          bloomLevel: 'EVALUATE',
          questionType: 'JUSTIFICATION',
          content: `Evaluate the trade-offs of adopting ${sampleTopic} compared to traditional methods. Justify your conclusion.`,
          expectedAnswer: `Justify the choice by weighing efficiency, complexity, and resource constraints detailed in the text.`,
          explanation: `Evaluation requires making grounded judgments and defending criteria based on evidence.`,
          sourceChunkReferences: [`Chunk ${relevantChunks[0]?.chunkIndex ?? 0}`],
        },
      ],
      summary: `You completed the overview for ${sampleTopic}. Continue practicing to master higher-order Bloom levels!`,
    };
  }

  async evaluateAnswer(req: AnswerEvaluationRequest): Promise<AnswerEvaluationResponse> {
    const userAns = req.userAnswer.trim().toLowerCase();
    const expAns = req.expectedAnswer.trim().toLowerCase();

    if (req.questionType === 'MULTIPLE_CHOICE') {
      const isCorrect = userAns === expAns || expAns.includes(userAns) || userAns.includes(expAns);
      return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        correctConcepts: isCorrect ? ['Selected correct option'] : [],
        missingConcepts: isCorrect ? [] : ['Selected incorrect distractor'],
        feedback: isCorrect
          ? 'Spot on! Based on your uploaded material, that option is correct.'
          : `Not quite. The correct answer grounded in your document is: "${req.expectedAnswer}".`,
        suggestedImprovement: 'Review the explanation and source chunk citation for details.',
      };
    }

    // Heuristic short-answer scoring for demo mode
    const lengthScore = Math.min(100, Math.max(30, userAns.length * 2));
    const isPass = lengthScore >= 60;

    return {
      isCorrect: isPass,
      score: lengthScore,
      correctConcepts: ['Demonstrated engagement with material', 'Grounded key terms'],
      missingConcepts: isPass ? [] : ['Requires deeper elaboration on expected concepts'],
      feedback: `Based on the expected concepts in your uploaded material, your response shows ${
        isPass ? 'strong' : 'partial'
      } understanding of ${req.bloomLevel.toLowerCase()} level concepts.`,
      suggestedImprovement: 'Incorporate specific definitions and source chunk citations to maximize your score.',
    };
  }
}
