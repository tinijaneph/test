import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { chatAPI } from './services/api'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const USER_ID = 'user-001' // Replace with auth later

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await chatAPI.getSessions(USER_ID)
      setSessions(data.sessions || [])
    } catch (e) {
      console.error(e)
    }
  }

  const startNewSession = () => {
    const newId = uuidv4()
    setCurrentSessionId(newId)
    setMessages([])
  }

  const loadSession = async (sessionId) => {
    setCurrentSessionId(sessionId)
    try {
      const data = await chatAPI.getHistory(sessionId)
      setMessages(data.history || [])
    } catch (e) {
      console.error(e)
    }
  }

  const deleteSession = async (sessionId) => {
    await chatAPI.deleteSession(sessionId)
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
      setMessages([])
    }
    loadSessions()
  }

  const sendMessage = async (text) => {
    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = uuidv4()
      setCurrentSessionId(sessionId)
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const data = await chatAPI.sendMessage(text, sessionId, USER_ID)
      const assistantMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMsg])
      loadSessions()
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={startNewSession}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          loading={loading}
          hasSession={!!currentSessionId}
          onNewSession={startNewSession}
        />
      </main>
    </div>
  )
}
