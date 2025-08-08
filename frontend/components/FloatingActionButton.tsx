interface FABProps {
  onClick: () => void
}

export default function FloatingActionButton({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '64px',
        height: '64px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#ffffff',
        borderRadius: '50%',
        border: 'none',
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        zIndex: 50,
        fontSize: '24px',
        fontWeight: '300'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
      }}
    >
      <svg 
        width="28" 
        height="28" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
      >
        <path d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}