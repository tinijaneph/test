import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message }) {
  const [copiedAnswer, setCopiedAnswer] = useState(false)
  const [vote, setVote] = useState(null)
  const [activeSource, setActiveSource] = useState(null)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopiedAnswer(true)
    setTimeout(() => setCopiedAnswer(false), 2000)
  }

  const handleSourceClick = (src) => {
    setActiveSource(activeSource?.index === src.index ? null : src)
  }

  const handleContactHR = () => {
    window.location.href = 'mailto:hr@company.com?subject=Policy Question'
  }

  if (isUser) {
    return (
      <div className="user-row">
        <div className="user-bubble">
          <p>{message.content}</p>
        </div>
        <div className="avatar user-avatar">You</div>
      </div>
    )
  }

  return (
    <div className="assistant-row">
      <div className="avatar assistant-avatar">AI</div>
      <div className="assistant-content">

        {/* Answer text - free flowing, no box */}
        <div className="assistant-answer">
          <ReactMarkdown
            components={{
              p: ({children}) => <p className="answer-paragraph">{children}</p>,
              strong: ({children}) => <strong className="answer-bold">{children}</strong>,
              ul: ({children}) => <ul className="answer-list">{children}</ul>,
              ol: ({children}) => <ol className="answer-list">{children}</ol>,
              li: ({children}) => <li className="answer-list-item">{children}</li>,
              h1: ({children}) => <h3 className="answer-heading">{children}</h3>,
              h2: ({children}) => <h3 className="answer-heading">{children}</h3>,
              h3: ({children}) => <h3 className="answer-heading">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Source pills + expandable passage */}
        {message.sources && message.sources.length > 0 && (
          <div className="sources-section">
            <p className="sources-label">📎 Sources — click to view passage</p>
            <div className="source-pills">
              {message.sources.map((src, i) => (
                <button
                  key={i}
                  className={`source-pill ${activeSource?.index === src.index ? 'active' : ''}`}
                  onClick={() => handleSourceClick(src)}
                >
                  <span className="pill-num">{src.index}</span>
                  <span className="pill-title">
                    {src.title.replace(/_/g, ' ').replace('.pdf', '')}
                  </span>
                  <span className="pill-chevron">
                    {activeSource?.index === src.index ? '▲' : '▼'}
                  </span>
                </button>
              ))}
            </div>

            {/* Actual passage panel */}
            {activeSource && (
              <div className="passage-panel">
                <div className="passage-header">
                  <span className="passage-doc-title">
                    📄 {activeSource.title.replace(/_/g, ' ').replace('.pdf', '')}
                  </span>
                  <button
                    className="passage-close"
                    onClick={() => setActiveSource(null)}
                  >✕</button>
                </div>
                <div className="passage-content">
                  {activeSource.snippet ? (
                    <>
                      <p className="passage-label">Relevant passage from document:</p>
                      <blockquote className="passage-quote">
                        {activeSource.snippet}
                      </blockquote>
                    </>
                  ) : (
                    <p className="passage-placeholder">
                      No preview available for this document.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="action-bar">
          <button
            className={`action-btn ${vote === 'up' ? 'active-up' : ''}`}
            onClick={() => setVote(vote === 'up' ? null : 'up')}
            title="Good response"
          >👍</button>
          <button
            className={`action-btn ${vote === 'down' ? 'active-down' : ''}`}
            onClick={() => setVote(vote === 'down' ? null : 'down')}
            title="Bad response"
          >👎</button>
          <button
            className="action-btn"
            onClick={handleCopy}
            title="Copy response"
          >{copiedAnswer ? '✅' : '📋'}</button>
          <div className="action-divider" />
          <button
            className="action-btn contact-hr-btn"
            onClick={handleContactHR}
          >✉️ Contact HR</button>
        </div>

        <div className="message-meta">
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
