import { Router as _Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Session } from "../models/Session.js";

const historyRouter = _Router();

historyRouter.get("/my-sessions", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const sessions = await Session.find({ users: uid })
      .populate({ path: "users", select: "username" })
      .populate({ path: "initiator", select: "username" })
      .sort({ acceptedAt: -1, startedAt: -1 })
      .limit(100)
      .lean();
    res.json({ sessions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

export default historyRouter;