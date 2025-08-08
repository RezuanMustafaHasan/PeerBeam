import React from 'react'
import { io } from 'socket.io-client'
import { API_BASE } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ActiveUsers({ onPick }){
  const { token, user } = useAuth()
  const [users,setUsers] = React.useState([])
  const socketRef = React.useRef(null)

  React.useEffect(()=>{
    const socket = io(API_BASE, { autoConnect:false, auth:{ token } })
    socket.connect(); socketRef.current = socket
    socket.on('connect_error', (err)=>console.error('ws error', err.message))
    socket.on('presence:update', (list)=>{
      setUsers(list.filter(u=>u.username!==user?.username))
    })
    fetch(`${API_BASE}/api/users/online`).then(r=>r.json()).then(d=>{
      setUsers(d.users.filter(u=>u.username!==user?.username))
    })
    return ()=>{ socket.disconnect() }
  },[])

  function request(u){
    socketRef.current.emit('connect:request', { toUserId: u.userId })
    alert(`Requested ${u.username}. Wait for accept.`)
    onPick(u)
  }

  return (
    <ul className="list">
      {users.map(u=> (
        <li key={u.userId}>
          <button onClick={()=>request(u)}>{u.username}</button>
        </li>
      ))}
    </ul>
  )
}