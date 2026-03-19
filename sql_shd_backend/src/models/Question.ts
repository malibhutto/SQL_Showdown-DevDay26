import mongoose, { Document, Schema } from 'mongoose';

export interface IExpectedOutput {
  type: 'scalar' | 'table';
  columns?: string[];
  rows: (string | number | null)[][];
  orderMatters: boolean;
  caseSensitive: boolean;
  numericTolerance: number;
}

export interface IConstraints {
  allowOnlySelect: boolean;
  maxRows: number;
  maxQueryLength: number;
}

export interface ITestCase {
  setupSql: string;
  expectedStdout: string;
  expectedColumns?: string[];
  expectedRows?: (string | number | null)[][];
  isHidden: boolean;
}

export interface IQuestion extends Document {
  questionId: string;
  title: string;
  description: string;
  setupSql: string;
  starterSql: string;
  solutionSql: string;        // The correct SQL query
  expectedStdout: string;     // The expected raw stdout from OneCompiler
  dialect: string;
  expectedOutput: IExpectedOutput;
  constraints: IConstraints;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  testCases?: ITestCase[];
}

const expectedOutputSchema = new Schema<IExpectedOutput>({
  type: {
    type: String,
    enum: ['scalar', 'table'],
    required: true
  },
  columns: [{
    type: String
  }],
  rows: {
    type: Schema.Types.Mixed,
    required: true
  },
  orderMatters: {
    type: Boolean,
    default: false
  },
  caseSensitive: {
    type: Boolean,
    default: false
  },
  numericTolerance: {
    type: Number,
    default: 0
  }
}, { _id: false });

const constraintsSchema = new Schema<IConstraints>({
  allowOnlySelect: {
    type: Boolean,
    default: true
  },
  maxRows: {
    type: Number,
    default: 100
  },
  maxQueryLength: {
    type: Number,
    default: 5000
  }
}, { _id: false });

const testCaseSchema = new Schema<ITestCase>({
  setupSql: { type: String, required: true },
  expectedStdout: { type: String, required: true },
  expectedColumns: [{ type: String }],
  expectedRows: { type: Schema.Types.Mixed },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const questionSchema = new Schema<IQuestion>({
  questionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  setupSql: {
    type: String,
    required: true
  },
  starterSql: {
    type: String,
    default: ''
  },
  solutionSql: {
    type: String,
    required: true
  },
  expectedStdout: {
    type: String,
    default: ''  // Will be populated when seeding
  },
  dialect: {
    type: String,
    enum: ['sqlite', 'mysql', 'postgresql'],
    default: 'sqlite'
  },
  points: {
    type: Number,
    default: 100
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  expectedOutput: {
    type: expectedOutputSchema,
    required: true
  },
  constraints: {
    type: constraintsSchema,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  testCases: {
    type: [testCaseSchema],
    default: undefined
  }
});

// Indexes
questionSchema.index({ createdAt: -1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
