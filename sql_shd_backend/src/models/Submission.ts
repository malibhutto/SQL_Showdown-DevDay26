import mongoose, { Document, Schema } from 'mongoose';

export interface IExecution {
  stdout: string;
  stderr: string | null;
  executionTimeMs: number;
  memoryUsedKb: number;
}

export type Verdict = 'Accepted' | 'Wrong Answer' | 'Runtime Error';

export interface ISubmission extends Document {
  teamName: string;
  questionId: string;
  submittedSql: string;
  execution: IExecution;
  verdict: Verdict;
  judgeMessage?: string;
  submittedAt: Date;
}

const executionSchema = new Schema<IExecution>({
  stdout: {
    type: String,
    default: ''
  },
  stderr: {
    type: String,
    default: null
  },
  executionTimeMs: {
    type: Number,
    required: true
  },
  memoryUsedKb: {
    type: Number,
    required: true
  }
}, { _id: false });

const submissionSchema = new Schema<ISubmission>({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  questionId: {
    type: String,
    required: true,
    trim: true
  },
  submittedSql: {
    type: String,
    required: true
  },
  execution: {
    type: executionSchema,
    required: true
  },
  verdict: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error'],
    required: true
  },
  judgeMessage: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
submissionSchema.index({ teamName: 1, questionId: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ verdict: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
