import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    userPicturePath: {
        type: String,
        required: true
    },
    storyId: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    agree: {
        type: Map,
        default: []
    },
    disagree: {
        type: Map,
        default: []
    }
}, { timestamps: true});

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;