import { comparePassword, getToken, hashPassword } from "../helpers/auth";
import { SigninValidator, SignupValidator } from "../validation/authValidation";
import { commentValidator, postValidator } from "../validation/postValidation";

export const resolvers = {
    Query: {
        getUser: async (_ : any, __ : any, context: any) => {
            return  {
                id: '123',
                name: 'ashu',
                email: 'ashu@mail',
                password: '123',
            };
        }
    },
    Mutation: {
        createUser: async (_ : any, args: any, context: any) => {
            const { input } = args;
            const error = await SignupValidator(input);
            if(error){
                throw new Error(error.details[0].message);
            }
            const user = await context.models.User.findOne({email: input.email});
            if(user){
                throw new Error("User already exist with this email, try different email");
            }

            const hashedPassword = await hashPassword(input.password);

            const newUser = new context.models.User({
                ...input,
                password: hashedPassword,
            });
            await newUser.save();

            return newUser;
        },
        signInUser: async (_ : any, args : any, context: any) => {
            const { input } = args;
            const error = await SigninValidator(input);
            if(error){
                throw new Error(error.details[0].message);
            }

            const user = await context.models.User.findOne({email: input.email});
            if(!user){
                throw new Error("User with this email does not exist");
            }

            const isPassword = await comparePassword(input.password, user.password);
            if(!isPassword){
                throw new Error("Wrong password!");
            }

            const token = getToken(user);

            return {
                ...user._doc,
                token
            }
        },
        createPost: async (_ : any, args: any, context: any) => {
            const { input } = args;
            const error = await postValidator(input);
            if(error) {
                throw new Error(error.details[0].message);
            }

            const newPost = await context.models.Post({
                ...input,
                createdBy: context.user.id
            });

            const post = await newPost.save();
            await context.models.User.findByIdAndUpdate(context.user.id, {$push: {posts: post._id}});

            return post;
        },
        createComment: async (_ : any, args: any, context: any) => {
            const { input } = args;
            const error = await commentValidator(input);

            if(error){
                throw new Error(error.details[0].message);
            }

            const newComment = await context.models.Comment({
                ...input,
                createdBy: context.user.id
            });
            const comment = await newComment.save();

            await context.models.Post.findByIdAndUpdate(input.postId, { $push: { comments: comment._id }});
            await context.models.User.findByIdAndUpdate(context.user.id, {$push: {comments: comment._id}});

            return comment;
        }
    },
    User: {
        password() {
            return null;
        }
    },
    Post : {
        createdBy: async (post : any, _ : any, context : any) => {
            const user = await context.models.User.findOne({_id: post.createdBy});
            return user;
        }
    },
    Comment: {
        createdBy: async (comment: any, _:any, context: any) => {
            const user = await context.models.User.findOne({_id: comment.createdBy});
            return user;
        }
    }
} 