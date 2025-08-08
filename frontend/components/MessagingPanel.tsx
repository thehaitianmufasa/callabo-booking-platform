'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface Message {
  id: string
  from: string
  to: string
  message: string
  timestamp: Date
  isRead: boolean
  phoneNumber?: string
}

interface Conversation {
  userId: string
  userName: string
  lastMessage: string
  timestamp: Date
  unreadCount: number
  phoneNumber?: string
}

export default function Messaging() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newPhone, setNewPhone] = useState('')

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${user?.id}`)
      const data = await res.json()
      
      if (res.ok) {
        // Process messages to create conversations
        const messagesByUser = new Map()
        
        data.messages?.forEach((msg: any) => {
          const otherUserId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id
          const otherUserName = msg.sender_id === user?.id ? 'Contact' : 'Contact' // We'll need to fetch user names from a users table
          
          if (!messagesByUser.has(otherUserId)) {
            messagesByUser.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName,
              lastMessage: msg.message,
              timestamp: new Date(msg.created_at),
              unreadCount: 0,
              phoneNumber: msg.recipient_phone || msg.sender_phone
            })
          } else {
            const conv = messagesByUser.get(otherUserId)
            if (new Date(msg.created_at) > conv.timestamp) {
              conv.lastMessage = msg.message
              conv.timestamp = new Date(msg.created_at)
            }
          }
        })
        
        setConversations(Array.from(messagesByUser.values()))
      } else {
        console.error('Failed to fetch messages:', data.error)
        // Set empty conversations for now
        setConversations([])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    }
  }

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${user?.id}&contactId=${contactId}`)
      const data = await res.json()
      
      if (res.ok) {
        const formattedMessages = data.messages?.map((msg: any) => ({
          id: msg.id,
          from: msg.sender_id,
          to: msg.recipient_id,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          isRead: msg.status === 'read'
        })) || []
        
        setMessages(formattedMessages)
      } else {
        console.error('Failed to fetch messages:', data.error)
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const selectedUser = conversations.find(c => c.userId === selectedConversation)
    
    try {
      // Send message via API
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user?.id,
          recipient_id: selectedConversation,
          message: newMessage,
          recipient_phone: selectedUser?.phoneNumber,
          send_sms: false // Set to true to send actual SMS
        })
      })

      if (res.ok) {
        const result = await res.json()
        const message: Message = {
          id: result.message.id,
          from: user?.id || 'me',
          to: selectedConversation,
          message: newMessage,
          timestamp: new Date(),
          isRead: true,
          phoneNumber: selectedUser?.phoneNumber
        }

        setMessages([...messages, message])
        setNewMessage('')

        // Update conversation list
        setConversations(prev => prev.map(conv => 
          conv.userId === selectedConversation 
            ? { ...conv, lastMessage: newMessage, timestamp: new Date(), unreadCount: 0 }
            : conv
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleSendSMS = (phoneNumber: string) => {
    // Create SMS link
    const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(newMessage)}`
    window.location.href = smsLink
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      marginBottom: '30px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      display: 'flex',
      height: '500px',
      overflow: 'hidden'
    }}>
      {/* Conversations List */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: 0,
            color: '#333'
          }}>
            Messages
          </h3>
          <button
            onClick={() => setShowNewConversation(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '600'
            }}
          >
            +
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {conversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
              No conversations yet.<br />
              Click "+" to start a new conversation.
            </div>
          ) : (
            conversations.map(conv => (
            <div
              key={conv.userId}
              onClick={() => {
                setSelectedConversation(conv.userId)
                fetchMessages(conv.userId)
              }}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: selectedConversation === conv.userId ? '#f8f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (selectedConversation !== conv.userId) {
                  e.currentTarget.style.background = '#fafafa'
                }
              }}
              onMouseOut={(e) => {
                if (selectedConversation !== conv.userId) {
                  e.currentTarget.style.background = 'white'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {conv.userName.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#333'
                    }}>
                      {conv.userName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {formatTime(conv.timestamp)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.lastMessage}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {conversations.find(c => c.userId === selectedConversation)?.userName.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                fontSize: '16px',
                color: '#333'
              }}>
                {conversations.find(c => c.userId === selectedConversation)?.userName}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {conversations.find(c => c.userId === selectedConversation)?.phoneNumber}
              </div>
            </div>
            <button
              onClick={() => {
                const phone = conversations.find(c => c.userId === selectedConversation)?.phoneNumber
                if (phone) {
                  window.location.href = `sms:${phone}`
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '2px solid #667eea',
                background: 'white',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Text via SMS
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.from === 'me' || msg.from === user?.id ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: msg.from === 'me' || msg.from === user?.id 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)'
                    : '#f0f0f0',
                  color: msg.from === 'me' || msg.from === user?.id ? 'white' : '#333'
                }}>
                  <div style={{ marginBottom: '4px' }}>{msg.message}</div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '2px solid #e8e9ff',
                fontSize: '14px',
                background: '#f8f9ff',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '16px'
        }}>
          Select a conversation to start messaging
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '30px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 20px 0',
              color: '#333'
            }}>
              New Conversation
            </h3>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Enter phone number (+1 555 123 4567)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '16px',
                background: '#f8f9ff',
                marginBottom: '20px'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNewConversation(false)
                  setNewPhone('')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newPhone) {
                    window.location.href = `sms:${newPhone}`
                    setShowNewConversation(false)
                    setNewPhone('')
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}