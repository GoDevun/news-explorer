import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { getCurrentUser } from '../controllers/users.js';
import { auth } from '../middlewares/auth.js';

export const usersRouter = Router();

usersRouter.get('/me', auth, getCurrentUser);

export const signupValidator = celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
});

export const signinValidator = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
});
