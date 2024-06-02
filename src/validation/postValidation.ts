import Joi from 'joi';

export const postValidator = async (postInput: any) => {
    const postSchema = Joi.object({
        tweet: Joi.string().required().min(3),
    });
    const { error } = postSchema.validate(postInput);
    return error;
}

export const updatePostValidator = async (updatePostInput: any) => {
    const updatePostSchema = Joi.object({
        tweet: Joi.string().required().min(3),
        postId: Joi.string().required()
    });
    const { error } = updatePostSchema.validate(updatePostInput);
    return error;
}

export const commentValidator = async (commentInput: string) => {
    const commentSchema = Joi.object({
        comment: Joi.string().required().min(3),
        postId: Joi.string().required()
    });
    const { error } = commentSchema.validate(commentInput);
    return error;
} 

export const updateCommentValidator = async (updateCommentInput: string) => {
    const updateCommentSchema = Joi.object({
        comment: Joi.string().required().min(3),
        commentId: Joi.string().required()
    });
    const { error } = updateCommentSchema.validate(updateCommentInput);
    return error;
} 