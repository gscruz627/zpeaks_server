import express from "express";
const router = express.Router();
import {
  getStoryController,
  getAllStoriesControllers,
  getUserStoriesController,
  getStoriesByTopicController,
  getStoryCommentsController,
  newCommentController,
  newStoryController,
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
  searchController
} from "../controllers/storyControllers.js";
import verifyToken from "../middleware/verifyToken.js";

router.get("/story/:id", getStoryController);
router.get("/stories", verifyToken, getAllStoriesControllers);
router.get("/:userId/stories", verifyToken, getUserStoriesController);
router.get("/story/:id/comments", verifyToken, getStoryCommentsController);
router.get("/topics/:name", verifyToken, getStoriesByTopicController);
router.get("/topics", verifyToken, getTopicsController);
router.get("/:userId/agree", verifyToken, getUserAgreeStoriesController);
router.get("/:userId/disagree", verifyToken, getUserDisagreeStoriesController);
router.get("/search/:choice/:keyword", verifyToken, searchController);

router.post("/story/:id/newComment", verifyToken, newCommentController);
router.patch("/story/:id/agree", verifyToken, agreeController);
router.patch("/story/:id/disagree", verifyToken, disagreeController);
router.patch("/story/:id/rate", verifyToken, rateController);
router.patch("/comment/:id/agree", verifyToken, commentAgreeController);
router.patch("/comment/:id/disagree", verifyToken, commentDisagreeController);

router.delete("/story/:id", verifyToken, deleteStoryController);
router.delete("/story/:id/comment", verifyToken, deleteCommentController);
export default router;
