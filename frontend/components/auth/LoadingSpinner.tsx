'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#667eea' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizeMap[size];
  const borderWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: `${borderWidth}px solid rgba(102, 126, 234, 0.2)`,
          borderTop: `${borderWidth}px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
    </div>
  );
}