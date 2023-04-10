import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    followers: {
        type: Map,
        default: []
    },
    following: {
        type: Map,
        default: []
    },
    topics: {
        type: Array,
        default: []
    },
    userPicturePath: {
        type: String,
    }
}, { timestamps: true})

const User = mongoose.model("User", UserSchema);
export default User;