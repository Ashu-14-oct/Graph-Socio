import Joi from 'joi';

export const SignupValidator = async (signUpInput: any) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(3),
    });
    const { error } = userSchema.validate(signUpInput);
    return error;
} 

export const SigninValidator = async (signInInput: any) => {
    const userSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required().min(3),
    });
    const { error } = userSchema.validate(signInInput);
    return error;
} 