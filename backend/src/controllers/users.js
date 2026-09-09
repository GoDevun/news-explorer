import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/user.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign({ _id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const createUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hash });
    // Sign the user straight in; there is no email confirmation step.
    res.status(201).send({ user, token: signToken(user) });
  } catch (error) {
    if (error.code === 11000) {
      next(new ConflictError('An account with that email already exists'));
      return;
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findUserByCredentials(email, password);
    res.send({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).orFail(
      () => new NotFoundError('User not found')
    );
    res.send(user);
  } catch (error) {
    next(error);
  }
};
