import mongoose, { Document, Types } from 'mongoose';

interface IPost extends Document {
    tweet: string;
    createdBy?: Types.ObjectId;
}

const postSchema = new mongoose.Schema({
    tweet: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true
});

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;