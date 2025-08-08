export const onlineUsers = new Map(); // userId -> { socketId, username }

export function setOnline(userId, socketId, username) {
  onlineUsers.set(userId, { socketId, username });
}
export function setOffline(userId) {
  onlineUsers.delete(userId);
}
export function listOnline() {
  return Array.from(onlineUsers, ([userId, v]) => ({ userId, username: v.username }));
}