import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [systemTime, setSystemTime] = useState('')
  
  useEffect(() => {
    setSystemTime(new Date().toLocaleString())
    
    // Update time every second
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
      minHeight: '100vh'
    }}>
      <Head>
        <title>Jikuna JXP Backend</title>
        <meta name="description" content="Backend service for Jikuna JXP calculations" />
      </Head>

      <main style={{ 
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1.5rem', 
          color: '#1e293b',
          fontWeight: '700',
          background: 'linear-gradient(to right, #3b82f6, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          padding: '1rem 0'
        }}>
          Jikuna JXP Backend
        </h1>
        
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1.5rem', 
            color: '#4b5563',
            lineHeight: '1.6'
          }}>
            Backend service for Jikuna Xtra Points (JXP) calculation is running successfully.
            This service processes swap events from the Monad blockchain and calculates JXP rewards.
          </p>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginTop: '2rem',
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              margin: '0', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              Status: 
              <span style={{ 
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                  display: 'inline-block'
                }}></span>
                Online
              </span>
            </p>
            <p style={{ margin: '0', color: '#64748b' }}>Server Time: {systemTime}</p>
          </div>
          
          <div style={{ marginTop: '2.5rem' }}>
            <h2 style={{ 
              fontSize: '1.4rem', 
              marginBottom: '1.25rem',
              color: '#334155',
              fontWeight: '600'
            }}>
              API Endpoints:
            </h2>
            <ul style={{ 
              listStyle: 'none',
              textAlign: 'left', 
              maxWidth: '500px',
              margin: '0 auto',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <li style={{ 
                padding: '0.75rem 1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.2rem 0.4rem',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>GET</span>
                /api/jxp/status
              </li>
              <li style={{ 
                padding: '0.75rem 1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.2rem 0.4rem',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>GET</span>
                /api/simple-test
              </li>
            </ul>
          </div>
          
          <div style={{ 
            marginTop: '2.5rem', 
            padding: '1.5rem', 
            borderTop: '1px solid #e5e7eb',
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            &copy; {new Date().getFullYear()} Jikuna DEX | Powering DeFi on Monad
          </div>
        </div>
      </main>
    </div>
  )
} 