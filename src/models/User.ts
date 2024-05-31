import mongoose, { Document, Types } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    posts?: Types.ObjectId[];
    comments?: Types.ObjectId[];
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        requried: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    }]
}, {
    timestamps: true
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;