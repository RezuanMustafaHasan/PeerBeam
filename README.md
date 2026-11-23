# PeerBeam

A browser-to-browser chat and file-sharing project built with React, WebRTC,
Socket.IO, Express, and MongoDB. Users register, see who is online, request a
connection, and send messages or files after the other user accepts.

## How it works

- [client/](client/) opens a WebRTC data channel and sends chat messages and
  file chunks directly to the other browser.
- [server/](server/) handles login, presence, and session history. Socket.IO
  relays connection requests and WebRTC signaling messages.
- MongoDB stores user records and session metadata, including file names and
  sizes. File contents travel on the WebRTC data channel.

The current client uses STUN. Some network combinations require a TURN relay,
which is not configured in this project.

## Run locally

Use Node.js 22 and a running MongoDB instance. In one terminal:

```bash
npm --prefix server install
JWT_SECRET="$(openssl rand -hex 32)" CORS_ORIGIN=http://localhost:5173 npm --prefix server start
```

The API listens on `http://localhost:8080`. It uses
`mongodb://127.0.0.1:27017/p2pshare` by default. Override `MONGO_URI` in the
environment for another database.

In a second terminal:

```bash
npm --prefix client install
npm --prefix client run dev -- --port 5173 --strictPort
```

Open [the client](http://localhost:5173) in two separate browser profiles. Register
a different user in each, accept a connection request, and send a short message
and a small file. For a different API address, supply `VITE_API_BASE` when
starting the client.

## Verification

```bash
npm --prefix server test
npm --prefix client run build
```

The server test checks module loading and the session model. Use the two-browser
demo to check signaling and data transfer.
