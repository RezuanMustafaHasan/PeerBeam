import { Schema, model, Types } from "mongoose";

const ContactSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User" },
    username: String,
    lastConnectedAt: Date,
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    contacts: [ContactSchema],
    online: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

export default model("User", UserSchema);