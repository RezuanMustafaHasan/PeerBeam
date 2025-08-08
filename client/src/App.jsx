import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function Gate(){
  const { user, token } = useAuth()
  const [mode, setMode] = React.useState('login')
  if(!token || !user){
    return (
      <div className="auth">
        {mode==='login' ? <Login onSwitch={()=>setMode('register')} /> : <Register onSwitch={()=>setMode('login')} />}
      </div>
    )
  }
  return <Dashboard />
}

export default function App(){
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}