import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
    name: {
        type: String,
    }
})

const Topic = mongoose.model("Topic", TopicSchema);
export default Topic;