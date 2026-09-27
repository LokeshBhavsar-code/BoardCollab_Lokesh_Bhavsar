import mongoose from "mongoose";

const roomMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "editor"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [2, "Room name must be at least 2 characters"],
      maxlength: [100, "Room name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Room owner is required"],
      index: true
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private"
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    members: [roomMemberSchema],
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

roomSchema.index({ ownerId: 1, isArchived: 1 });
roomSchema.index({ "members.userId": 1 });

export const Room = mongoose.model("Room", roomSchema);
export default Room;
