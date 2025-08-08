
import React from 'react'
import { io } from 'socket.io-client'
import { API_BASE } from '../api'
import { useAuth } from '../context/AuthContext'

const STUN_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]
// const TURN_SERVERS = [{ urls: 'turn:YOUR_TURN_HOST:3478', username:'user', credential:'pass' }]

export function useWebRTC(peer){
  const { token } = useAuth()
  const [socket, setSocket] = React.useState(null)
  const [pc, setPc] = React.useState(null)
  const dcRef = React.useRef(null)
  const [room, setRoom] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [progress, setProgress] = React.useState({})

  React.useEffect(()=>{
    const s = io(API_BASE, { autoConnect:false, auth:{ token } })
    s.connect(); setSocket(s)
    return ()=>{ s.disconnect() }
  },[token])

  React.useEffect(()=>{
    if(!socket) return

    socket.on('connect:incoming', ({ fromUserId, fromUsername })=>{
      if(peer && peer.userId !== fromUserId) return
      if(confirm(`${fromUsername} wants to connect. Accept?`)){
        socket.emit('connect:accept', { fromUserId })
      }
    })

    socket.on('connect:accepted', ({ room })=>{
      setRoom(room)
      initPeer(room)
    })

    socket.on('signal:offer', async ({ sdp })=>{
      await pc?.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc?.createAnswer();
      await pc?.setLocalDescription(answer)
      socket.emit('signal:answer', { room, sdp: pc.localDescription })
    })

    socket.on('signal:answer', async ({ sdp })=>{
      await pc?.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    socket.on('signal:ice', async ({ candidate })=>{
      try{ await pc?.addIceCandidate(candidate) }catch(e){ console.error(e) }
    })

  },[socket, pc, peer])

  async function initPeer(roomId){
    const peerConnection = new RTCPeerConnection({ iceServers: [ ...STUN_SERVERS /*, ...TURN_SERVERS */ ] })
    setPc(peerConnection)

    peerConnection.onicecandidate = (e)=>{
      if(e.candidate){ socket.emit('signal:ice', { room: roomId, candidate: e.candidate }) }
    }

    peerConnection.ondatachannel = (e)=>{ setupDataChannel(e.channel) }

    const dc = peerConnection.createDataChannel('p2p')
    setupDataChannel(dc)

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit('signal:offer', { room: roomId, sdp: peerConnection.localDescription })
  }

  function setupDataChannel(dc){
    dcRef.current = dc
    dc.binaryType = 'arraybuffer'
    dc.onopen = ()=>{ pushMsg({ system:true, text:'P2P channel opened' }) }
    dc.onclose = ()=>{ pushMsg({ system:true, text:'P2P channel closed' }) }
    dc.onmessage = (e)=>{
      if(typeof e.data === 'string'){
        const msg = JSON.parse(e.data)
        if(msg.type==='chat'){ pushMsg({ self:false, text: msg.text }) }
        if(msg.type==='file-meta'){ receiveFileInit(msg.meta) }
        if(msg.type==='file-done'){ finalizeFile(msg.meta) }
      } else {
        receiveChunk(e.data)
      }
    }
  }

  function sendChat(text){ dcRef.current?.send(JSON.stringify({ type:'chat', text })) ; pushMsg({ self:true, text }) }
  function pushMsg(m){ setMessages(prev=>[...prev, { id:crypto.randomUUID(), ...m }]) }

  const incoming = React.useRef({})

  function sendFiles(fileList){
    const dc = dcRef.current; if(!dc) return
    const files = Array.from(fileList)
    files.forEach(async (file)=>{
      const id = crypto.randomUUID()
      dc.send(JSON.stringify({ type:'file-meta', meta:{ id, name:file.name, size:file.size } }))
      const chunkSize = 64 * 1024
      let offset = 0
      while(offset < file.size){
        const slice = file.slice(offset, offset + chunkSize)
        const buf = await slice.arrayBuffer()
        while(dc.bufferedAmount > 4 * 1024 * 1024){ await new Promise(r=>setTimeout(r,50)) }
        dc.send(buf)
        offset += buf.byteLength
        setProgress(p=>({ ...p, [id]: Math.floor((offset/file.size)*100) }))
      }
      dc.send(JSON.stringify({ type:'file-done', meta:{ id, name:file.name, size:file.size } }))
      try { socket?.emit('history:file', { room, files:[{ name: file.name, size: file.size }] }) } catch {}
    })
  }

  function receiveFileInit(meta){
    incoming.current[meta.id] = { name: meta.name, size: meta.size, received: 0, buffers: [] }
    setProgress(p=>({ ...p, [meta.id]: 0 }))
  }

  function receiveChunk(buffer){
    const keys = Object.keys(incoming.current)
    if(!keys.length) return
    const id = keys[keys.length-1]
    const info = incoming.current[id]
    info.received += buffer.byteLength
    info.buffers.push(buffer)
    setProgress(p=>({ ...p, [id]: Math.floor((info.received/info.size)*100) }))
  }

  function finalizeFile(meta){
    const info = incoming.current[meta.id]
    if(!info) return
    const blob = new Blob(info.buffers)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = info.name; a.click()
    URL.revokeObjectURL(url)
    delete incoming.current[meta.id]
  }

  return { socket, room, pc, sendChat, messages, sendFiles, progress }
}
