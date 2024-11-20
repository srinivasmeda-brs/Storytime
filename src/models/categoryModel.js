import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: Boolean, default: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Use mongoose.model() instead of mongoose.Model()
const Category = mongoose.model('Category', CategorySchema);  // Correct method

export default Category;
