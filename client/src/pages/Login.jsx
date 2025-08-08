import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login({ onSwitch }){
  const { login, setUser } = useAuth()
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [err,setErr]=useState('')

  async function onSubmit(e){
    e.preventDefault(); setErr('')
    try{ await login(username,password); setUser({ username }) }catch(e){ setErr(e.response?.data?.error||'Login failed') }
  }
  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="error">{err}</div>}
        <button type="submit">Login</button>
      </form>
      <p>New here? <button onClick={onSwitch}>Create account</button></p>
    </div>
  )
}