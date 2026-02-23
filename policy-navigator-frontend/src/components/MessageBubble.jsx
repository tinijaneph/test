import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources-section">
            <button
              className="sources-toggle"
              onClick={() => setShowSources(!showSources)}
            >
              📄 {message.sources.length} source{message.sources.length > 1 ? 's' : ''} {showSources ? '▲' : '▼'}
            </button>
            {showSources && (
              <div className="sources-list">
                {message.sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <span className="source-index">[{src.index}]</span>
                    <span className="source-title">{src.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
