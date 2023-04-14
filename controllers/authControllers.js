import { cloudinary, uploadImage, __dirname } from "../app.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Story from "../models/Story.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
dotenv.config();
const JWT_SIGNATURE = process.env.JWT_SIGNATURE;
const registerController = async (req, res) => {
  try {
    let imagePath = "";
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    if (req.file) {
      uploadImage(req.file.buffer).then(async (secure_url) => {
        user.userPicturePath = secure_url;
        const savedUser = await user.save();
        res.status(200).json(savedUser);
      });
    } else {
      user.userPicturePath =
        "https://yodm-server.onrender.com/public/assets/unknownProfilePicture.png";
      const savedUser = await user.save();
      res.status(200).json(savedUser);
    }
  } catch (err) {
    res.status(400).json({ error: err.message, code: "first" });
  }
};
const loginController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user;
    if (!username) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ username: username });
    }
    if (!user)
      return res.status(400).json({ error: "Server Authentication Failed" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Server Authentication Failed" });
    const token = jwt.sign({ id: user._id }, JWT_SIGNATURE);
    delete user.password;
    res.status(200).json({ user: user, token: token });
  } catch (err) {
    res.status(400).json({ err: "Error on login logic: " + err.message });
  }
};
const getUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({
      error: "Server-side Error on handling user information, message: " + err,
    });
  }
};
const getFollowersController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = User.findById(id);
    const rawFollowers = await Promise.all(
      user.followers.map((id) => User.findById(id))
    );
    const followers = rawFollowers.map(({ _id, username, userPicturePath }) => {
      return { _id, username, userPicturePath };
    });
    res.status(200).json(followers);
  } catch (err) {
    res.status(500).json({ err: "Server error, with message: " + err });
  }
};
const getFollowingController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    const rawFollowing = await Promise.all(
      Array.from(user.following).map(([id, value]) => User.findById(id))
    );

    const following = rawFollowing.map(({ _id, username, userPicturePath }) => {
      return { _id, username, userPicturePath };
    });
    res.status(200).json(following);
  } catch (err) {
    res.status(500).json({ err: "Server error, with message: " + err });
  }
};
const followController = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    const sourceUser = await User.findById(id);
    const targetUser = await User.findById(targetId);

    const alreadyFollowing = sourceUser.following.get(targetUser._id);
    if (alreadyFollowing) {
      sourceUser.following.delete(targetUser._id);
      targetUser.followers.delete(sourceUser._id);
    } else {
      sourceUser.following.set(targetUser._id, true);
      targetUser.followers.set(sourceUser._id, true);
    }

    await targetUser.save();
    await sourceUser.save();
    const rawFollowing = await Promise.all(
      Array.from(sourceUser.following).map(([id, value]) => User.findById(id))
    );

    const following = rawFollowing.map(({ _id, username, userPicturePath }) => {
      return { _id, username, userPicturePath };
    });
    res.status(200).json(following);
  } catch (err) {
    res.status(500).json({ err: "Error on following handling: " + err });
  }
};
const changePasswordController = async (req, res) => {
  try {
    const { id, oldPassword, newPassword } = req.body;
    const user = await User.findById(id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (isMatch) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      const savedUser = await user.save();
      res.status(200).json(savedUser);
    } else {
      res.status(401).json({ err: "Wrong Password" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ err: "Error on changing password, can not: " + err });
  }
};
const userDeleteController = async (req, res) => {
  try {
    if (req.user) {
      const { id } = req.body;
      const user = await User.find({_id: id});

      if (!user) {
        return res.status(404).json({ err: "User not found" });
      }

      await Comment.deleteMany({ userId: user._id });
      await Story.deleteMany({ userId: user._id });
      await User.deleteOne({_id: id});

      return res
        .status(200)
        .json({
          message:
            "Successfully deleted user and associated comments and stories",
        });
    } else {
      res.status(401).json({ err: "Unauthorized" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ err: "Error on user delete, cannot delete: " + err });
  }
};
const changeUsernameController = async (req, res) => {
  try {
    const { newUsername, userId } = req.body;
    const user = await User.findById(userId);
    user.username = newUsername;
    const savedUser = await user.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
const changeEmailController = async (req, res) => {
  try {
    const { newEmail, userId } = req.body;
    const user = await User.findById(userId);
    user.email = newEmail;
    const savedUser = await user.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
const changeProfilePictureController = async (req, res) => {
  try {
    let imagePath = "";
    const { userId } = req.body;
    const user = await User.findById(userId);
    let savedUser;
    if (req.file) {
      uploadImage(req.file.buffer).then(async (secure_url) => {
        user.userPicturePath = secure_url;
        savedUser = await user.save();
        res.status(200).json(savedUser);
      });
    } else {
      res.status(400).json({ err: "No image was processed" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
export {
  registerController,
  loginController,
  getUserController,
  getFollowersController,
  getFollowingController,
  followController,
  changePasswordController,
  userDeleteController,
  changeEmailController,
  changeProfilePictureController,
  changeUsernameController,
};
