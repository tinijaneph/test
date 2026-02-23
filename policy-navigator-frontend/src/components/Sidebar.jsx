import React from 'react'

export default function Sidebar({
  sessions, currentSessionId, onNewSession,
  onSelectSession, onDeleteSession, isOpen, onToggle
}) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={onToggle}>
          {isOpen ? '←' : '→'}
        </button>
        {isOpen && <span className="sidebar-title">Policy Navigator</span>}
      </div>

      {isOpen && (
        <>
          <button className="new-chat-btn" onClick={onNewSession}>
            + New Conversation
          </button>

          <div className="sessions-list">
            <p className="sessions-label">Recent Chats</p>
            {sessions.length === 0 && (
              <p className="no-sessions">No conversations yet</p>
            )}
            {sessions.map(session => (
              <div
                key={session.session_id}
                className={`session-item ${currentSessionId === session.session_id ? 'active' : ''}`}
                onClick={() => onSelectSession(session.session_id)}
              >
                <span className="session-preview">
                  {session.last_message || 'New conversation'}
                </span>
                <button
                  className="delete-session-btn"
                  onClick={e => { e.stopPropagation(); onDeleteSession(session.session_id) }}
                >✕</button>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="policy-badge">📋 10 Policies Loaded</div>
          </div>
        </>
      )}
    </aside>
  )
}
