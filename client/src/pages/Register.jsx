import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Register({ onSwitch }){
  const { register } = useAuth()
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [ok,setOk]=useState('')
  const [err,setErr]=useState('')
  async function onSubmit(e){
    e.preventDefault(); setErr('')
    try{ await register(username,password); setOk('Account created. You can login now.')}catch(e){ setErr(e.response?.data?.error||'Register failed') }
  }
  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Unique username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {ok && <div className="ok">{ok}</div>}
        {err && <div className="error">{err}</div>}
        <button type="submit">Create</button>
      </form>
      <p>Have an account? <button onClick={onSwitch}>Login</button></p>
    </div>
  )
}