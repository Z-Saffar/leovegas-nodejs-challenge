import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { formatErrors } from '../utils/jsonapi';

export const validate = (validations: ValidationChain[]) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const validationErrors = validationResult(req);
        if (validationErrors.isEmpty()) {
            return next();
        }
        const errors = validationErrors.array().map(error => ({
            status: '400',
            title: 'Bad Request',
            detail: error.msg ?? 'Validation failed',
        }));
        return res.status(400).json(formatErrors(errors));

    }
}