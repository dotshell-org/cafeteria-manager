import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import Loading from './Loading.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense fallback={<Loading />}>
            <App />
        </Suspense>
    </React.StrictMode>,
)

// Using contextBridge
window.ipcRenderer.on('main-process-message', (_event: any, message: any) => {
    console.log(message)
})