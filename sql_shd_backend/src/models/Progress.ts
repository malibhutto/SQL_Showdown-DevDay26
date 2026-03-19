import mongoose, { Document, Schema } from 'mongoose';

export interface ISolvedQuestion {
  questionId: string;
  solvedAt: Date;
  points: number;
  submissionId: mongoose.Types.ObjectId;
  executionTimeMs: number;
}

export interface IProgress extends Document {
  teamName: string;
  competitionId: string;
  startedAt: Date;
  duration: number; // in milliseconds
  totalPoints: number;
  solvedQuestions: ISolvedQuestion[];
  questionOrder: string[]; // Shuffled question IDs unique to this team
  lastActivityAt: Date;
  ended: boolean;
}

const SolvedQuestionSchema = new Schema<ISolvedQuestion>({
  questionId: {
    type: String,
    required: true
  },
  solvedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  points: {
    type: Number,
    required: true,
    default: 100
  },
  submissionId: {
    type: Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  executionTimeMs: {
    type: Number,
    default: 0
  }
}, { _id: false });

const ProgressSchema = new Schema<IProgress>({
  teamName: {
    type: String,
    required: true,
    index: true
  },
  competitionId: {
    type: String,
    required: true,
    index: true
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number,
    required: true,
    default: 30 * 60 * 1000 // 30 minutes
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0
  },
  solvedQuestions: {
    type: [SolvedQuestionSchema],
    default: []
  },
  questionOrder: {
    type: [String],
    default: [],
    required: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  ended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound unique index: one progress per team per competition
ProgressSchema.index({ teamName: 1, competitionId: 1 }, { unique: true });

// Get solved question IDs for quick lookup
ProgressSchema.methods.getSolvedQuestionIds = function(): string[] {
  return this.solvedQuestions.map((q: ISolvedQuestion) => q.questionId);
};

// Check if a question is already solved
ProgressSchema.methods.isQuestionSolved = function(questionId: string): boolean {
  return this.solvedQuestions.some((q: ISolvedQuestion) => q.questionId === questionId);
};

// Add a solved question and update points
ProgressSchema.methods.addSolvedQuestion = function(
  questionId: string, 
  points: number, 
  submissionId: mongoose.Types.ObjectId,
  executionTimeMs: number
): void {
  // Don't add duplicate
  if (!this.isQuestionSolved(questionId)) {
    this.solvedQuestions.push({
      questionId,
      solvedAt: new Date(),
      points,
      submissionId,
      executionTimeMs
    });
    this.totalPoints += points;
    this.lastActivityAt = new Date();
  }
};

export const Progress = mongoose.model<IProgress>('Progress', ProgressSchema);
