import mongoose from "mongoose";

const LanguageSchema = new mongoose.Schema(
    {
        name: { type: String },
        keywords: { type: String },
        status: { type: Boolean, default: true },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

const Language = mongoose.model('Language', LanguageSchema); // Corrected to mongoose.model

export default Language;
