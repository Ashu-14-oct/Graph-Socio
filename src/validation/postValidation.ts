import Joi from 'joi';

export const postValidator = async (postInput: any) => {
    const postSchema = Joi.object({
        tweet: Joi.string().required().min(3),
    });
    const { error } = postSchema.validate(postInput);
    return error;
} 