import React from 'react'

const Loading: React.FC<{ message?: string, fullScreen?: boolean }> = ({ 
  message = 'Loading...', 
  fullScreen = false 
}) => (
    <div style={{
        fontFamily: 'sans-serif',
        height: fullScreen ? '100vh' : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        width: '100%'
    }}>
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
        <div>{message}</div>
    </div>
)

export default Loading