import mongoose, { Schema } from 'mongoose';

export interface ICompetitionConfig {
  _id: string; // Always 'global' - singleton pattern
  competitionName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  isActive: boolean;
  maxTeams: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionConfigSchema = new Schema<ICompetitionConfig>({
  _id: { 
    type: String, 
    default: 'global' 
  },
  competitionName: { 
    type: String, 
    default: 'SQL Competition',
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, 
    default: 30 * 60 * 1000, // 30 minutes default
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  maxTeams: { 
    type: Number, 
    default: 100 
  }
}, {
  timestamps: true,
  _id: false // We manage _id ourselves
});

// Static method to get or create the global config
CompetitionConfigSchema.statics.getGlobalConfig = async function(): Promise<ICompetitionConfig | null> {
  return this.findById('global');
};

// Static method to update or create global config
CompetitionConfigSchema.statics.setGlobalConfig = async function(
  config: Partial<ICompetitionConfig>
): Promise<ICompetitionConfig> {
  return this.findByIdAndUpdate(
    'global',
    { ...config, _id: 'global' },
    { upsert: true, new: true, runValidators: true }
  );
};

export const CompetitionConfig = mongoose.model<ICompetitionConfig>('CompetitionConfig', CompetitionConfigSchema);
