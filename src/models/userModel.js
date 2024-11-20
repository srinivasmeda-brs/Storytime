// userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    first_name: { type: 'string', default: null },
    last_name: { type: 'string', default: null },
    email: { type: 'string', unique: true },
    password: { type: 'string' },
    languages: { type: 'Array' },
    categories: { type: 'Array' },
    saved_stories: { type: 'Array' },
    token: { type: 'string' },
    verified: { type: 'boolean', default: false },
    verify_token: { type: 'string' },
    verify_token_expires: Date,
    reset_password_token: { type: 'string' },
    reset_password_expires: Date,
    status: { type: 'boolean', default: true }, // fixed typo here
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
