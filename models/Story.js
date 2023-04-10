import mongoose from "mongoose";

const StorySchema = new mongoose.Schema( {
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
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        min: 100,
    },
    agree: {
        type: Map,
        default: [],
    },
    disagree: {
        type: Map,
        default: [],
    },
    rating: {
        type: Map,
        default: []
    },
    responses: {
        type: Number,
        default: 0,
    },
    comments: {
        type: Array,
        default: []
    },
    imagePath: {
        type: String,
    },
    topic: {
        type: Array,
    },
    response: {
        type: String
    }
}, { timestamps: true});

const Story = mongoose.model("Story", StorySchema);
export default Story;