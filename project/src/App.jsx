import { useState, useEffect } from 'react'
import Monetization from './components/monetization/Monetization'
import BananaClickerGame from './components/BananaClickerGame'

function App() {

  return (
    <Monetization>
      <BananaClickerGame />
    </Monetization>
  )
}

export default App