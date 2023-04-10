import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import {v2 as cloudinary} from "cloudinary";
import authRoutes from "./routes/authRoutes.js";
import storyRoutes from "./routes/storyRoutes.js"
import { changeProfilePictureController, registerController } from "./controllers/authControllers.js"
import { newStoryController } from "./controllers/storyControllers.js";
import multer from "multer";

const app = express();
dotenv.config();
const db_string = process.env.DB_STRING;

app.use(cors());
app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(helmet.crossOriginResourcePolicy( { policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json( { limit: "50mb", extended: true}));
app.use(bodyParser.urlencoded( { limit: "50mb", extended: true}));
app.use(express.static("public/assets"));
cloudinary.config({
    cloud_name: "drhxsbeef",
    api_key: "741999597212787",
    api_secret: "vsRItW9JSgBIz9g5yInkJErX6sg"
});
const upload = multer({
    storage: multer.memoryStorage()
});
function uploadImage(imageBuffer){
  return new Promise( (resolve, reject) => {
      cloudinary.uploader.upload_stream( { resource_type: 'auto' }, async function(error, result){
          if (error) {
            reject(error)
            console.error(error);
          } else {
            console.log(result);
            resolve(result.secure_url)
          }
        }).end(imageBuffer);
  })
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



mongoose
  .connect(db_string, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("MONGO connection successfull");
  })
  .catch((err) => {
    console.log("MONGO error: " + err);
  });

app.use("/public/assets/", express.static(__dirname + "/public/assets/"));
app.get("/", (req, res) => {
  res.status(200).json( { message: "working"})
});
app.use("/auth", authRoutes);
app.use("/", storyRoutes);
app.post("/auth/register", upload.single('picture'), registerController);
app.post("/newStory", upload.single("picture"), newStoryController);
app.patch("/auth/changeProfilePicture", upload.single("picture"), changeProfilePictureController)

app.listen(8080);
export { cloudinary, uploadImage, __dirname }