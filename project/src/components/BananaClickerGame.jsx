import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Statistic, Row, Col, Typography, Space, Badge } from 'antd'
import { BananaClicker } from '../entities/BananaClicker'

const { Title, Text } = Typography

function BananaClickerGame() {
  const [gameData, setGameData] = useState({
    bananas: 0,
    clickPower: 1,
    autoClickerCount: 0,
    autoClickerRate: 0,
    upgrades: {}
  })
  const [isLoading, setIsLoading] = useState(true)

  const upgrades = [
    {
      id: 'clickPower',
      name: 'Better Fingers',
      description: 'Increase click power by 1',
      baseCost: 10,
      effect: (level) => level,
      type: 'clickPower'
    },
    {
      id: 'autoClicker',
      name: 'Monkey Helper',
      description: 'Auto-clicks 1 banana per second',
      baseCost: 100,
      effect: (level) => level,
      type: 'autoClicker'
    },
    {
      id: 'superClick',
      name: 'Golden Touch',
      description: 'Multiply click power by 2',
      baseCost: 500,
      effect: (level) => Math.pow(2, level),
      type: 'multiplier'
    }
  ]

  const loadGameData = useCallback(async () => {
    try {
      const response = await BananaClicker.list()
      if (response.success && response.data.length > 0) {
        const data = response.data[0]
        setGameData({
          bananas: data.bananas || 0,
          clickPower: data.clickPower || 1,
          autoClickerCount: data.autoClickerCount || 0,
          autoClickerRate: data.autoClickerRate || 0,
          upgrades: data.upgrades || {}
        })
      }
    } catch (error) {
      console.error('Failed to load game data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveGameData = useCallback(async (data) => {
    try {
      const response = await BananaClicker.list()
      const saveData = {
        userId: 1,
        bananas: data.bananas,
        clickPower: data.clickPower,
        autoClickerCount: data.autoClickerCount,
        autoClickerRate: data.autoClickerRate,
        upgrades: data.upgrades
      }

      if (response.success && response.data.length > 0) {
        await BananaClicker.update(response.data[0]._id, saveData)
      } else {
        await BananaClicker.create(saveData)
      }
    } catch (error) {
      console.error('Failed to save game data:', error)
    }
  }, [])

  useEffect(() => {
    loadGameData()
  }, [loadGameData])

  useEffect(() => {
    if (!isLoading) {
      saveGameData(gameData)
    }
  }, [gameData, saveGameData, isLoading])

  useEffect(() => {
    if (gameData.autoClickerRate > 0) {
      const interval = setInterval(() => {
        setGameData(prev => ({
          ...prev,
          bananas: prev.bananas + prev.autoClickerRate
        }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameData.autoClickerRate])

  const handleBananaClick = () => {
    const totalClickPower = gameData.clickPower * (gameData.upgrades.superClick ? Math.pow(2, gameData.upgrades.superClick) : 1)
    setGameData(prev => ({
      ...prev,
      bananas: prev.bananas + totalClickPower
    }))
  }

  const buyUpgrade = (upgrade) => {
    const currentLevel = gameData.upgrades[upgrade.id] || 0
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel))
    
    if (gameData.bananas >= cost) {
      const newLevel = currentLevel + 1
      const newUpgrades = { ...gameData.upgrades, [upgrade.id]: newLevel }
      
      let newGameData = {
        ...gameData,
        bananas: gameData.bananas - cost,
        upgrades: newUpgrades
      }

      if (upgrade.type === 'clickPower') {
        newGameData.clickPower = 1 + (newUpgrades.clickPower || 0)
      } else if (upgrade.type === 'autoClicker') {
        newGameData.autoClickerCount = newUpgrades.autoClicker || 0
        newGameData.autoClickerRate = newUpgrades.autoClicker || 0
      }

      setGameData(newGameData)
    }
  }

  const getUpgradeCost = (upgrade) => {
    const currentLevel = gameData.upgrades[upgrade.id] || 0
    return Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel))
  }

  const canAffordUpgrade = (upgrade) => {
    return gameData.bananas >= getUpgradeCost(upgrade)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 p-4">
      <div className="max-w-6xl mx-auto">
        <Title level={1} className="text-center text-yellow-800 mb-8">
          🍌 Banana Clicker Game 🍌
        </Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card className="text-center bg-yellow-50 border-yellow-300">
              <Space direction="vertical" size="large" className="w-full">
                <Statistic
                  title="Bananas"
                  value={Math.floor(gameData.bananas)}
                  valueStyle={{ color: '#faad14', fontSize: '3rem' }}
                  suffix="🍌"
                />
                
                <Button
                  type="primary"
                  size="large"
                  className="banana-button bg-yellow-500 border-yellow-500 hover:bg-yellow-600 text-4xl h-32 w-32 rounded-full"
                  onClick={handleBananaClick}
                >
                  🍌
                </Button>
                
                <div className="text-lg text-gray-600">
                  <Text>Click Power: {gameData.clickPower * (gameData.upgrades.superClick ? Math.pow(2, gameData.upgrades.superClick) : 1)}</Text>
                  <br />
                  <Text>Bananas/sec: {gameData.autoClickerRate}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="🛒 Upgrades" className="bg-orange-50 border-orange-300">
              <Space direction="vertical" size="middle" className="w-full">
                {upgrades.map((upgrade) => {
                  const cost = getUpgradeCost(upgrade)
                  const canAfford = canAffordUpgrade(upgrade)
                  const level = gameData.upgrades[upgrade.id] || 0
                  
                  return (
                    <Card
                      key={upgrade.id}
                      size="small"
                      className={`${canAfford ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Text strong>{upgrade.name}</Text>
                            {level > 0 && <Badge count={level} color="#faad14" />}
                          </div>
                          <Text type="secondary" className="text-sm">
                            {upgrade.description}
                          </Text>
                        </div>
                        <Button
                          type={canAfford ? "primary" : "default"}
                          disabled={!canAfford}
                          onClick={() => buyUpgrade(upgrade)}
                          className={canAfford ? "bg-green-500 border-green-500" : ""}
                        >
                          Buy - {cost}🍌
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default BananaClickerGame