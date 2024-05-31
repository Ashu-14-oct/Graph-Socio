import mongoose, { Document } from 'mongoose';

interface IPost extends Document {
    tweet: string;
}

const postSchema = new mongoose.Schema({
    tweet: {
        type: String,
        required: true,
    }
},{
    timestamps: true
});

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;