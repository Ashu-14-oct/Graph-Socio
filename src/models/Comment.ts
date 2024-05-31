import mongoose, { Document, Types } from "mongoose";

interface IComment extends Document {
    comment: string;
    createdBy?: Types.ObjectId; 
}

const commentSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true,
});

const Comment = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;