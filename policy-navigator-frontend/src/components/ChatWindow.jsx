import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ messages, onSendMessage, loading, onNewSession }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    // Auto resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const suggestedQuestions = [
    "What is the CEO remuneration policy?",
    "How are Non-Executive Directors compensated?",
    "What are the Long Term Incentive conditions?",
    "What is the severance policy for the CEO?"
  ]

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-icon">🏢</div>
          <div>
            <h1>HR Policy Navigator</h1>
            <p>Ask questions about company policies — answers grounded in official documents</p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-icon">📋</div>
            <h2>How can I help you today?</h2>
            <p>Ask me anything about your company policies. I'll find the answer and cite my sources.</p>
            <div className="suggested-questions">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={() => onSendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="typing-row">
            <div className="avatar assistant-avatar">AI</div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask about company policies... (Enter to send, Shift+Enter for new line)"
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            ➤
          </button>
        </div>
        <p className="input-disclaimer">Answers are based on official company policy documents only.</p>
      </div>
    </div>
  )
}
