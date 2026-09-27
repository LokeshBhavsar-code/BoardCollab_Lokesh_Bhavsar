import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    snapshotAt: {
      type: Date,
      default: Date.now
    },
    lastOperationAt: {
      type: Date,
      default: Date.now
    },
    canvasStateRef: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
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

sessionSchema.index({ roomId: 1, status: 1 });
sessionSchema.index({ roomId: 1, version: 1 });

export const Session = mongoose.model("Session", sessionSchema);
export default Session;
