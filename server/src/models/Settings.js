const { Schema, model } = require('mongoose');

// Generic key/value store for app-level settings.
// Current keys: "usdToLkrFallback"
const settingsSchema = new Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = model('Settings', settingsSchema);
