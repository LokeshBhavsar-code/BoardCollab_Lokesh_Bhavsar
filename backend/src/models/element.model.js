import mongoose from "mongoose";

const elementSchema = new mongoose.Schema(
  {
    elementId: {
      type: String,
      required: true,
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ["path", "rect", "circle", "text", "line", "arrow"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.elementId || ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

elementSchema.index({ roomId: 1, isDeleted: 1 });
elementSchema.index({ roomId: 1, elementId: 1 }, { unique: true });
elementSchema.index({ sessionId: 1, updatedAt: -1 });

export const CanvasElement = mongoose.model("CanvasElement", elementSchema);
export default CanvasElement;
