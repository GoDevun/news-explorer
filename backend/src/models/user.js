import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { UnauthorizedError } from '../utils/errors.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 30 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'That is not a valid email address',
      },
    },
    // Never returned by a query unless explicitly selected.
    password: { type: String, required: true, select: false },
  },
  { versionKey: false, timestamps: true }
);

/**
 * Deliberately gives the same error for an unknown email and a wrong password,
 * so the endpoint cannot be used to discover which accounts exist.
 */
userSchema.statics.findUserByCredentials = async function findUserByCredentials(
  email,
  password
) {
  const user = await this.findOne({ email }).select('+password');
  if (!user) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  return user;
};

userSchema.methods.toJSON = function toJSON() {
  const { _id, name, email } = this;
  return { _id, name, email };
};

export const User = mongoose.model('user', userSchema);
