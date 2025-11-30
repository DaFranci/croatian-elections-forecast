import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import ElectionMap from './components/Map/ElectionMap'
import Sidebar from './components/UI/Sidebar'
import Header from './components/UI/Header'
import './App.css'

function App() {
    return (
        <AppProvider>
            <div className="app-container">
                <Header />
                <div className="main-content">
                    <ElectionMap />
                    <Sidebar />
                </div>
            </div>
        </AppProvider>
    )
}

export default App
