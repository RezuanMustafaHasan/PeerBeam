import React, { createContext, useContext, useState } from 'react'
import { api, setAuthToken } from '../api'

const AuthCtx = createContext(null)
export function AuthProvider({children}){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  React.useEffect(()=>{ if(token){ setAuthToken(token); api.get('/api/users/online').catch(()=>{}); } },[token])

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password })
    setToken(data.token); localStorage.setItem('token', data.token)
    setUser(data.user)
  }
  const register = async (username, password) => {
    await api.post('/api/auth/register', { username, password })
  }
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem('token'); setAuthToken(null) }

  return <AuthCtx.Provider value={{ user, token, login, register, logout, setUser }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)