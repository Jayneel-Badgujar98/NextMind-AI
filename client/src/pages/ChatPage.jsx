import React from 'react'
import ChatContainer from '../components/chat/ChatContainer'

const ChatPage = ({ onNavigate }) => {
  return (
    <div>
      <ChatContainer onNavigate={onNavigate} />
    </div>
  )
}

export default ChatPage
