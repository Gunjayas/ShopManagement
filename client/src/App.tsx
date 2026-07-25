import { useState, useEffect } from 'react'
import './App.css'
import { Order } from '@shared/types';
import type { OrderStatus } from '@shared/types';
function App() {
const [health, setHealth] = useState<string>('loading...')
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(JSON.stringify(data)))
      .catch(err => setHealth('error: ' + err.message))
  }, [])
  return <div>Health check: {health}</div>
}

export default App
