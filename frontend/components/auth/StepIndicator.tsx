'use client';

interface StepIndicatorProps {
  currentStep: 'phone' | 'verification';
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { key: 'phone', label: 'Enter Phone', number: 1 },
    { key: 'verification', label: 'Verify Code', number: 2 }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px'
    }}>
      {steps.map((step, index) => (
        <div
          key={step.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentStep === step.key
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : steps.findIndex(s => s.key === currentStep) > index
                ? '#10b981'
                : '#e0e0e0',
              color: currentStep === step.key || steps.findIndex(s => s.key === currentStep) > index
                ? 'white'
                : '#999',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {steps.findIndex(s => s.key === currentStep) > index ? (
              <span style={{ fontSize: '20px' }}>✓</span>
            ) : (
              step.number
            )}
            
            {currentStep === step.key && (
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '3px solid rgba(102, 126, 234, 0.3)',
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
          </div>
          
          <div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: currentStep === step.key ? '600' : '400',
              color: currentStep === step.key ? '#333' : '#999'
            }}>
              {step.label}
            </p>
          </div>
          
          {index < steps.length - 1 && (
            <div
              style={{
                width: '40px',
                height: '2px',
                background: steps.findIndex(s => s.key === currentStep) > index
                  ? '#10b981'
                  : '#e0e0e0',
                transition: 'all 0.3s ease'
              }}
            />
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}