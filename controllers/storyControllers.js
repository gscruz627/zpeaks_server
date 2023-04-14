import User from "../models/User.js";
import Story from "../models/Story.js";
import Comment from "../models/Comment.js";
import Topic from "../models/Topic.js";
import { cloudinary, uploadImage } from "../app.js";
import path from "path";

const getStoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json({ err: "Error on handling getStory: " + err });
  }
};

const searchController = async (req, res) => {
  try {
    const { choice, keyword } = req.params;
    let results;
    switch (choice) {
      case "stories":
        results = await Story.find({
          $or: [
            { title: { $regex: keyword, $options: "i" } },
            { content: { $regex: keyword, $options: "i" } },
          ],
        })
          .sort({ rating: -1 })
          .lean()
          .exec();
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          result.commentsFull = await Promise.all(
            result.comments.map((id) => Comment.findById(id))
          );
          if (result.response) {
            result.responseStory = await Story.findById(result.response);
          }
        }
        break;
      case "users":
        results = await User.find({
          username: { $regex: keyword, $options: "i" },
        }).sort({ followers: -1 });
        break;
    }
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAllStoriesControllers = async (req, res) => {
  try {
    const filter = req.query.filter;
    let stories;
    if (filter) {
      switch (filter) {
        case "mostrated":
          stories = await Story.aggregate([
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: -1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "leastrated":
          stories = await Story.aggregate([
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: 1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "mostagreed":
          stories = await Story.aggregate([
            {
              $addFields: { numAgree: { $size: { $objectToArray: "$agree" } } },
            },
            { $sort: { numAgree: -1 } },
          ]).exec();
          break;
        case "leastagreed":
          stories = await Story.aggregate([
            {
              $addFields: {
                numDisagree: { $size: { $objectToArray: "$disagree" } },
              },
            },
            { $sort: { numDisagree: -1 } },
          ]).exec();
          break;
        case "mostresponses":
          stories = await Story.find().sort({ responses: -1 }).lean();
          break;
        case "recent":
          stories = await Story.find().sort({ createdAt: -1 }).lean();
          break;
        default:
          stories = await Story.find().lean();
      }
    } else {
      stories = await Story.find().lean();
    }
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      story.commentsFull = await Promise.all(
        story.comments.map((id) => Comment.findById(id))
      );
      if (story.response) {
        story.responseStory = await Story.findById(story.response);
      }
    }

    res.status(200).json(stories);
  } catch (err) {
    res
      .status(400)
      .json({ err: "Error on handling getAlStories: " + err.message });
  }
};

const getUserStoriesController = async (req, res) => {
  try {
    const { userId } = req.params;
    //const stories = await Story.find({ userId: userId }).lean();
    const filter = req.query.filter;
    let stories;
    if (filter) {
      switch (filter) {
        case "mostrated":
          stories = await Story.aggregate([
            {
              $match: { userId: userId },
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: -1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "leastrated":
          stories = await Story.aggregate([
            {
              userId: userId,
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: 1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "mostagreed":
          stories = await Story.aggregate([
            {
              $match: { userId: userId },
            },
            {
              $addFields: { numAgree: { $size: { $objectToArray: "$agree" } } },
            },
            { $sort: { numAgree: -1 } },
          ]).exec();
          break;
        case "leastagreed":
          stories = await Story.aggregate([
            {
              $match: { userId: userId },
            },
            {
              $addFields: {
                numDisagree: { $size: { $objectToArray: "$disagree" } },
              },
            },
            { $sort: { numDisagree: -1 } },
          ]).exec();
          break;
        case "mostresponses":
          stories = await Story.find({ userId: userId })
            .sort({ responses: -1 })
            .lean();
          break;
        case "recent":
          stories = await Story.find({ userId: userId })
            .sort({ createdAt: -1 })
            .lean();
          break;
        default:
          stories = await Story.find({ userId: userId }).lean();
      }
    } else {
      stories = await Story.find({ userId: userId }).lean();
    }
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      story.commentsFull = await Promise.all(
        story.comments.map((id) => Comment.findById(id))
      );
      if (story.response) {
        story.responseStory = await Story.findById(story.response);
      }
    }
    res.status(200).json(stories);
  } catch (err) {
    res.status(400).json({ err: "Error on handling stories by user: " + err });
  }
};

const getUserAgreeStoriesController = async (req, res) => {
  try {
    const { userId } = req.params;
    //const stories = await Story.find({ [`agree.${userId}`]: true }).lean();
    const filter = req.query.filter;
    let stories;
    if (filter) {
      switch (filter) {
        case "mostrated":
          stories = await Story.aggregate([
            { [`agree.${userId}`]: true },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: -1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "leastrated":
          stories = await Story.aggregate([
            {
              [`agree.${userId}`]: true,
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: 1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "mostagreed":
          stories = await Story.aggregate([
            { [`agree.${userId}`]: true },
            {
              $addFields: { numAgree: { $size: { $objectToArray: "$agree" } } },
            },
            { $sort: { numAgree: -1 } },
          ]).exec();
          break;
        case "leastagreed":
          stories = await Story.aggregate([
            { [`agree.${userId}`]: true },
            {
              $addFields: {
                numDisagree: { $size: { $objectToArray: "$disagree" } },
              },
            },
            { $sort: { numDisagree: -1 } },
          ]).exec();
          break;
        case "mostresponses":
          stories = await Story.find({ [`agree.${userId}`]: true })
            .sort({ responses: -1 })
            .lean();
          break;
        case "recent":
          stories = await Story.find({ [`agree.${userId}`]: true })
            .sort({ createdAt: -1 })
            .lean();
          break;
        default:
          stories = await Story.find({ [`agree.${userId}`]: true }).lean();
      }
    } else {
      stories = await Story.find({ [`agree.${userId}`]: true }).lean();
    }
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      story.commentsFull = await Promise.all(
        story.comments.map((id) => Comment.findById(id))
      );

      if (story.response) {
        story.responseStory = await Story.findById(story.response);
      }
    }
    res.status(200).json(stories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUserDisagreeStoriesController = async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = req.query.filter;
    let stories;
    if (filter) {
      switch (filter) {
        case "mostrated":
          stories = await Story.aggregate([
            {
              [`disagree.${userId}`]: true,
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: -1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "leastrated":
          stories = await Story.aggregate([
            {
              [`disagree.${userId}`]: true,
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: 1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "mostagreed":
          stories = await Story.aggregate([
            { [`disagree.${userId}`]: true },
            {
              $addFields: { numAgree: { $size: { $objectToArray: "$agree" } } },
            },
            { $sort: { numAgree: -1 } },
          ]).exec();
          break;
        case "leastagreed":
          stories = await Story.aggregate([
            { [`disagree.${userId}`]: true },
            {
              $addFields: {
                numDisagree: { $size: { $objectToArray: "$disagree" } },
              },
            },
            { $sort: { numDisagree: -1 } },
          ]).exec();
          break;
        case "mostresponses":
          stories = await Story.find({ [`disagree.${userId}`]: true })
            .sort({ responses: -1 })
            .lean();
          break;
        case "recent":
          stories = await Story.find({ [`disagree.${userId}`]: true })
            .sort({ createdAt: -1 })
            .lean();
          break;
        default:
          stories = await Story.find({ [`disagree.${userId}`]: true }).lean();
      }
    } else {
      stories = await Story.find({ [`disagree.${userId}`]: true }).lean();
    }
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      story.commentsFull = await Promise.all(
        story.comments.map((id) => Comment.findById(id))
      );
      if (story.response) {
        story.responseStory = await Story.findById(story.response);
      }
    }
    res.status(200).json(stories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
const getStoryCommentsController = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    const comments = Promise.all(
      story.comments.map((id) => {
        Comment.findById(id);
      })
    );
    res.status(200).json(comments);
  } catch (err) {
    res.status(400).json({ err: "Error on getting story comments: " + err });
  }
};

const getStoriesByTopicController = async (req, res) => {
  try {
    const { name } = req.params;
    const filter = req.query.filter;
    let stories;
    if (filter) {
      switch (filter) {
        case "mostrated":
          stories = await Story.aggregate([
            {
              $match: { topic: { $in: [name] } },
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: -1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "leastrated":
          stories = await Story.aggregate([
            {
              topic: { $in: [name] },
            },
            {
              $addFields: {
                ratingValues: { $objectToArray: "$rating" },
              },
            },
            {
              $unwind: "$ratingValues",
            },
            {
              $group: {
                _id: "$_id",
                ratingSum: { $sum: "$ratingValues.v" },
                ratingCount: { $sum: 1 },
                story: { $first: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: "$story._id",
                ratingAverage: { $divide: ["$ratingSum", "$ratingCount"] },
                story: "$story",
              },
            },
            {
              $sort: {
                ratingAverage: 1,
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$story",
                    { ratingAverage: "$ratingAverage" },
                  ],
                },
              },
            },
          ]);
          break;
        case "mostagreed":
          stories = await Story.aggregate([
            { $match: { topic: { $in: [name] } } },
            {
              $addFields: { numAgree: { $size: { $objectToArray: "$agree" } } },
            },
            { $sort: { numAgree: -1 } },
          ]).exec();
          break;
        case "leastagreed":
          stories = await Story.aggregate([
            { $match: { topic: { $in: [name] } } },
            {
              $addFields: {
                numDisagree: { $size: { $objectToArray: "$disagree" } },
              },
            },
            { $sort: { numDisagree: -1 } },
          ]).exec();
          break;
        case "mostresponses":
          stories = await Story.find({ topic: { $in: [name] } })
            .sort({ responses: -1 })
            .lean();
          break;
        case "recent":
          stories = await Story.find({ topic: { $in: [name] } })
            .sort({ createdAt: -1 })
            .lean();
          break;
        default:
          stories = await Story.find({ topic: { $in: [name] } }).lean();
      }
    } else {
      stories = await Story.find({ topic: { $in: [name] } }).lean();
    }
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      story.commentsFull = await Promise.all(
        story.comments.map((id) => Comment.findById(id))
      );
      if (story.response) {
        story.responseStory = await Story.findById(story.response);
      }
    }

    res.status(200).json(stories);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Error on handling get stories by topic: " + err });
  }
};

const getTopicsController = async (req, res) => {
  try {
    const topics = await Topic.find();
    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ err: err });
  }
};
const newStoryController = async (req, res) => {
  try {
    const { userId, title, content, topic, response } = req.body;
    const user = await User.findById(userId);
    const story = new Story({
      userId,
      username: user.username,
      userPicturePath: user.userPicturePath,
      title,
      content,
      response,
      topic,
    });
    if (response) {
      const responseStory = await Story.findById(response);
      responseStory.responses++;
    }
    if (req.file) {
      uploadImage(req.file.buffer).then(async (secure_url) => {
        story.imagePath = secure_url;
        const savedStory = await story.save();
        res.status(200).json(savedStory);
      });
    } else {
      const savedStory = await story.save();

      res.status(200).json(savedStory);
    }
  } catch (err) {
    res.status(400).json({ err: "Error on creating a new story: " + err });
  }
};

const newCommentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId } = req.body;
    const story = await Story.findById(id);
    const user = await User.findById(userId);
    const comment = new Comment({
      userId: user._id,
      username: user.username,
      userPicturePath: user.userPicturePath,
      storyId: id,
      text,
    });
    const savedComment = await comment.save();
    story.comments.push(savedComment._id.toString());
    const savedStory = await story.save();
    const updatedStory = await Story.findById(id).lean();
    updatedStory.commentsFull = await Promise.all(
      savedStory.comments.map((id) => Comment.findById(id))
    );
    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(story.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ err: "Error on new comment: " + err });
  }
};

const agreeController = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const story = await Story.findById(id);
    const alreadyAgree = story.agree.get(userId);
    const isDisagree = story.disagree.get(userId);
    if (alreadyAgree) {
      story.agree.delete(userId);
    } else {
      if (isDisagree) {
        story.disagree.delete(userId);
      }
      story.agree.set(userId, true);
    }
    const savedStory = await story.save();
    const updatedStory = await Story.findById(id).lean();

    updatedStory.commentsFull = await Promise.all(
      story.comments.map((id) => Comment.findById(id))
    );
    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(story.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ err: "Error on agree controller: " + err });
  }
};

const disagreeController = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const story = await Story.findById(id);
    const alreadyDisagree = story.disagree.get(userId);
    const isAgree = story.agree.get(userId);
    if (alreadyDisagree) {
      story.disagree.delete(userId);
    } else {
      if (isAgree) {
        story.agree.delete(userId);
      }
      story.disagree.set(userId, true);
    }
    const savedStory = await story.save();
    const updatedStory = await Story.findById(id).lean();
    updatedStory.commentsFull = await Promise.all(
      story.comments.map((id) => Comment.findById(id))
    );
    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(story.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ err: "Error on agree controller: " + err });
  }
};

const rateController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, value } = req.body;
    const story = await Story.findById(id);
    story.rating.set(userId, value);
    const savedStory = await story.save();
    const updatedStory = await Story.findById(id).lean();
    updatedStory.commentsFull = await Promise.all(
      story.comments.map((id) => Comment.findById(id))
    );
    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(updatedStory.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(500).json("Error on rate controller: " + err);
  }
};

const commentAgreeController = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const comment = await Comment.findById(id);
    const alreadyAgree = comment.agree.get(userId);
    const isDisagree = comment.disagree.get(userId);
    if (alreadyAgree) {
      comment.agree.delete(userId);
    } else {
      if (isDisagree) {
        comment.disagree.delete(userId);
      }
      comment.agree.set(userId, true);
    }
    const savedComment = await comment.save();
    const updatedStory = await Story.findById(comment.storyId).lean();
    updatedStory.commentsFull = await Promise.all(
      updatedStory.comments.map((id) => Comment.findById(id))
    );
    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(updatedStory.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ err: "Error on agree comment controller: " + err });
  }
};

const commentDisagreeController = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const comment = await Comment.findById(id);
    const alreadyDisagree = comment.disagree.get(userId);
    const isAgree = comment.agree.get(userId);
    if (alreadyDisagree) {
      comment.disagree.delete(userId);
    } else {
      if (isAgree) {
        comment.agree.delete(userId);
      }
      comment.disagree.set(userId, true);
    }
    const savedComment = await comment.save();
    const updatedStory = await Story.findById(comment.storyId).lean();
    updatedStory.commentsFull = await Promise.all(
      updatedStory.comments.map((id) => Comment.findById(id))
    );

    if (updatedStory.response) {
      updatedStory.responseStory = await Story.findById(updatedStory.response);
    }
    res.status(200).json(updatedStory);
  } catch (err) {
    res.status(400).json({ err: "Error on agree comment controller: " + err });
  }
};

const deleteStoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const story = await Story.findById(id);
    if (userId === story.userId) {
      await Story.deleteOne({ _id: id });
      res.status(200).json({ msg: "Deleted story succesfully" });
    } else {
      res.status(500).json({
        err: "Fatal, deleting foreign story, DO NOT BYPASS OWNER MATCHING, warning: ",
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ err: "Error on delete story, cannot delete: " + err });
  }
};

const deleteCommentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const comment = await Comment.findById(id);
    const story = await Story.findById(comment.storyId);
    if (userId === comment.userId) {
      await Comment.deleteOne({ _id: id });
      story.comments = story.comments.filter((comment) => comment !== id);
      const savedStory = await story.save();
      const updatedStory = await Story.findById(savedStory._id).lean();
      updatedStory.commentsFull = await Promise.all(
        updatedStory.comments.map((id) => Comment.findById(id))
      );
      if (updatedStory.response) {
        updatedStory.responseStory = await Story.findById(savedStory.response);
      }
      res.status(200).json(updatedStory);
    } else {
      res.status(500).json({
        err: "Fatal, deleting foreign comment, DO NOT BYPASS OWNER MATCHING, warning: ",
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ err: "Error on delete comment, cannot delete: " + err });
  }
};

export {
  getStoryController,
  getAllStoriesControllers,
  getUserStoriesController,
  getStoriesByTopicController,
  getStoryCommentsController,
  newCommentController,
  newStoryController,
  searchController,
  agreeController,
  disagreeController,
  commentAgreeController,
  commentDisagreeController,
  rateController,
  deleteStoryController,
  deleteCommentController,
  getTopicsController,
  getUserAgreeStoriesController,
  getUserDisagreeStoriesController,
};
