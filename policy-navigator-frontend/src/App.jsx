import React, { useState } from 'react'
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

  const startNewSession = () => {
    // Save current session before clearing
    if (messages.length > 0 && currentSessionId) {
      setSessions(prev => {
        const exists = prev.find(s => s.session_id === currentSessionId)
        if (exists) {
          // Update existing session with latest messages
          return prev.map(s =>
            s.session_id === currentSessionId
              ? { ...s, messages, last_message: messages[0]?.content?.substring(0, 60) }
              : s
          )
        } else {
          // Add new session to top of list
          return [{
            session_id: currentSessionId,
            last_message: messages[0]?.content?.substring(0, 60) || 'New conversation',
            messages: messages,
            created_at: new Date().toISOString()
          }, ...prev]
        }
      })
    }
    // Start fresh
    const newId = uuidv4()
    setCurrentSessionId(newId)
    setMessages([])
  }

  const loadSession = (sessionId) => {
    // Save current session first
    if (messages.length > 0 && currentSessionId && currentSessionId !== sessionId) {
      setSessions(prev => prev.map(s =>
        s.session_id === currentSessionId
          ? { ...s, messages }
          : s
      ))
    }
    // Load selected session
    const session = sessions.find(s => s.session_id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages || [])
    }
  }

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.session_id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
      setMessages([])
    }
  }

  const sendMessage = async (text) => {
    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = uuidv4()
      setCurrentSessionId(sessionId)
    }

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const data = await chatAPI.sendMessage(text, sessionId)
      const assistantMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...updatedMessages, assistantMsg]
      setMessages(finalMessages)

      // Auto-save to session list
      setSessions(prev => {
        const exists = prev.find(s => s.session_id === sessionId)
        if (exists) {
          return prev.map(s =>
            s.session_id === sessionId
              ? { ...s, messages: finalMessages }
              : s
          )
        } else {
          return [{
            session_id: sessionId,
            last_message: text.substring(0, 60),
            messages: finalMessages,
            created_at: new Date().toISOString()
          }, ...prev]
        }
      })
    } catch (e) {
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMsg])
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
      <main className="main-content">
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          loading={loading}
          onNewSession={startNewSession}
        />
      </main>
    </div>
  )
}
