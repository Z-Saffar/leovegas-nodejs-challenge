import { body, param } from 'express-validator';

export const userValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Invalid role, user role must be either USER or ADMIN'),
];

export const userUpdateValidators = [
  param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Invalid role'),
  body().custom((_, { req }) => {
    const { name, email, role } = req.body;
    if (!name && !email && !role) {
      throw new Error('At least one of name, email, or role is required');
    }
    return true;
  }),
];

export const userDeleteValidators = [
  param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer'),
];

export const userGetByIdValidators = [
  param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer'),
];
