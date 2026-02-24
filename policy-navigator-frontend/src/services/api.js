const BACKEND_URL = "https://policy-navigator-backend-799818976326.us-central1.run.app"

export const chatAPI = {
  async sendMessage(message, sessionId, userId = 'anonymous') {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, user_id: userId })
    })
    if (!res.ok) throw new Error('Failed to send message')
    return res.json()
  },

  async getSessions(userId) {
    const res = await fetch(`${BACKEND_URL}/api/sessions/${userId}`)
    if (!res.ok) throw new Error('Failed to get sessions')
    return res.json()
  },

  async getHistory(sessionId) {
    const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/history`)
    if (!res.ok) throw new Error('Failed to get history')
    return res.json()
  },

  async deleteSession(sessionId) {
    await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, { method: 'DELETE' })
  }
}
