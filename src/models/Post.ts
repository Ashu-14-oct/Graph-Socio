import mongoose, { Document, Types } from 'mongoose';

interface IPost extends Document {
    tweet: string;
    comments?: Types.ObjectId[]; 
    createdBy?: Types.ObjectId;
}

const postSchema = new mongoose.Schema({
    tweet: {
        type: String,
        required: true,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true
});

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;