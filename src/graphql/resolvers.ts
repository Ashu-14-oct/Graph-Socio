import { comparePassword, getToken, hashPassword } from "../helpers/auth";
import { SigninValidator, SignupValidator } from "../validation/authValidation";
import { commentValidator, postValidator } from "../validation/postValidation";

export const resolvers = {
    Query: {
        getUserPosts: async (_ : any, args: any, context: any) => {        
            const { userId } = args;      
            const user = await context.models.User.findById(userId); 
            if(!user){
                throw new Error("User does not exist");
            }
            if(user.posts.length === 0){
                throw new Error("User haven't posted anything yet");
            }
            
            const posts = await Promise.all(user.posts.map(async (postId: string) => {
                const post = await context.models.Post.findById(postId);
                if (!post) {
                    throw new Error(`Post with ID ${postId} not found`);
                }
                return post;
            }));

            return posts;
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
            if(!context.user){
                throw new Error("User not authenticated");
            }
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
        deletePost: async (_: any, args: any, context: any) => {
            if(!context.user){
                throw new Error("User not authenticated");
            }
            console.log(context.user.id);
            
            const { postId } = args;
            console.log(postId);
            
            const post = await context.models.Post.findOne({_id: postId});
            console.log(post);
            
            if (!post) {
                throw new Error("Post not found");
            }

            if(post.createdBy.toString() !== context.user.id){
                throw new Error("Not authorized to delete this post")
            }
            console.log(context.user.id);
            await context.models.User.findByIdAndUpdate(context.user.id, {$pull: {posts: postId}});
            
            return { success: true, message: "Post deleted successfully" };
        },
        createComment: async (_ : any, args: any, context: any) => {
            if(!context.user){
                throw new Error("User not authenticated");
            }
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
        },
        followUser: async (_:any, args: any, context: any) => {
            if(!context.user){
                throw new Error("User not authenticated");
            }
            const userId = args.input.userId;
            const userToFollow = await context.models.User.findOne({_id: userId});
            
            if(!userToFollow){
                throw new Error("Cannot follow, User does not exist");
            }
            if(userToFollow.followers.includes(context.user.id)){
                throw new Error("Already following this user");
            }

            await context.models.User.findByIdAndUpdate(context.user.id, {$push: {followings: userToFollow._id}});
            await context.models.User.findByIdAndUpdate(userId, {$push: {followers: context.user.id}});

            const user = await context.models.User.findOne({_id: context.user.id});

            return user;
        },
        unfollowUser: async (_: any, args: any, context: any) => {
            if(!context.user){
                throw new Error("User not authenticated");
            }

            const userId = args.input.userId;
            const userToUnfollow = await context.models.User.findOne({_id: userId});
            if(!userToUnfollow){
                throw new Error("Cannot Unfollow, User does not exist");
            }
            if(!userToUnfollow.followers.includes(context.user.id)){
                throw new Error("Not following this user");
            }

            await context.models.User.findByIdAndUpdate(context.user.id, {$pull: {followings: userToUnfollow._id}});
            await context.models.User.findByIdAndUpdate(userId, {$pull: {followers: context.user.id}});

            const user = await context.models.User.findOne({_id: context.user.id});

            return user;
        }
    },
    User: {
        followings: async (user: any, _:any, context : any) => {
            return await context.models.User.find({ _id: { $in: user.followings } });
        },
        followers: async (user: any, _:any, context : any) => {
            return await context.models.User.find({ _id: { $in: user.followers } });
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