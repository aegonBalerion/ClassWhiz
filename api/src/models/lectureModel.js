import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
});

const lectureSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    files: [fileSchema],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);
