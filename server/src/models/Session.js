import { Schema as _Schema, model as _model, Types as _Types } from "mongoose";

const SessionSchema = new _Schema(
  {
    users: [{ type: _Types.ObjectId, ref: "User", required: true }], // [caller, callee]
    initiator: { type: _Types.ObjectId, ref: "User", required: true },
    room: { type: String, index: true },
    startedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    endedAt: { type: Date },
    files: [
      {
        name: { type: String, required: true },
        size: { type: Number, required: true },
        by: { type: _Types.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

SessionSchema.index({ users: 1, startedAt: -1 });

export const Session = _model("Session", SessionSchema);