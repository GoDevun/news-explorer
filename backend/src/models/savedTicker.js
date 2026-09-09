import mongoose from 'mongoose';

const savedTickerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      select: false,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 1,
      maxlength: 10,
      match: [/^[A-Z][A-Z.-]{0,9}$/, 'That is not a valid ticker symbol'],
    },
    companyName: { type: String, default: '', maxlength: 120 },
    note: { type: String, default: '', maxlength: 280 },
    // Snapshot of the reading when the ticker was saved, so the list can show
    // how the mood has moved without spending quota on every render.
    lastSentiment: {
      score: { type: Number, default: 0 },
      tone: { type: String, enum: ['bullish', 'bearish', 'neutral'], default: 'neutral' },
      label: { type: String, default: 'Neutral' },
      capturedAt: { type: Date, default: Date.now },
    },
  },
  { versionKey: false, timestamps: true }
);

// One entry per ticker per user; the controller turns the duplicate-key
// error into a 409.
savedTickerSchema.index({ owner: 1, symbol: 1 }, { unique: true });

// `select: false` hides the owner on queries but not on a document we just
// created, so drop it on the way out no matter how the document was built.
savedTickerSchema.methods.toJSON = function toJSON() {
  const object = this.toObject();
  delete object.owner;
  return object;
};

export const SavedTicker = mongoose.model('savedTicker', savedTickerSchema);
