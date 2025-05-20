import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const IMG_WIDTH = 1200;
const IMG_HEIGHT = 630;

// Use default system font
const fontFamily = 'Arial';

function generateMainScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        color: 'white',
        padding: 40,
        fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ 
          fontSize: 100, 
          marginRight: 10,
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
          borderRadius: '50%',
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          💹
        </div>
        <h1 style={{ 
          fontSize: 80, 
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)', 
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          margin: 0 
        }}>
          JIKUNA SWAP
        </h1>
      </div>
      
      <h2 style={{ 
        fontSize: 36, 
        marginBottom: 40,
        color: '#94A3B8',
        textAlign: 'center'
      }}>
        First DEX on Monad TestNet for Farcaster
      </h2>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        maxWidth: 1000
      }}>
        <FeatureCard emoji="💱" title="Swap Tokens" description="Exchange tokens with low fees & minimal slippage" />
        <FeatureCard emoji="💎" title="JXP Rewards" description="Earn Jikuna XtraPoints rewards" />
        <FeatureCard emoji="📊" title="Leaderboard" description="Get into Top 10 traders for bonus XP" />
        <FeatureCard emoji="🌐" title="Cross-Platform" description="Use on web or Farcaster" />
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 20,
      padding: 20,
      width: 460,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ 
        fontSize: 50, 
        marginRight: 20,
        background: 'rgba(59, 130, 246, 0.2)',
        borderRadius: '50%',
        width: 70,
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {emoji}
      </div>
      <div>
        <h3 style={{ 
          fontSize: 24, 
          marginBottom: 5,
          color: 'white',
          margin: 0
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: 16, 
          color: '#94A3B8',
          margin: 0
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function generateSwapScreen(props: { fromToken?: string, toToken?: string, amount?: string, error?: string }) {
  const { fromToken = 'MON', toToken = 'USDC', amount = '0.1', error } = props;
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        color: 'white',
        padding: 40,
        fontFamily,
      }}
    >
      <div style={{ 
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: 40, 
          marginRight: 10,
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
          borderRadius: '50%',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          💹
        </div>
        <h1 style={{ 
          fontSize: 40, 
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)', 
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          margin: 0 
        }}>
          JIKUNA SWAP
        </h1>
      </div>
      
      <div style={{
        width: '100%',
        maxWidth: 800,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
        padding: 40,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h2 style={{ 
          fontSize: 40, 
          marginBottom: 30,
          color: 'white',
          textAlign: 'center'
        }}>
          Swap Token
        </h2>
        
        {/* Token input */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 15,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 10
          }}>
            <span style={{ color: '#94A3B8', fontSize: 18 }}>You Send</span>
            <span style={{ color: '#94A3B8', fontSize: 18 }}>Balance: 0.00</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>{amount}</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(59, 130, 246, 0.2)',
              padding: '8px 16px',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <span style={{ fontSize: 18, marginRight: 8 }}>{fromToken}</span>
              <span style={{ fontSize: 18 }}>▼</span>
            </div>
          </div>
        </div>
        
        {/* Arrow down */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          margin: '15px 0',
          fontSize: 24
        }}>
          ⬇️
        </div>
        
        {/* Token output */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 10
          }}>
            <span style={{ color: '#94A3B8', fontSize: 18 }}>You Receive</span>
            <span style={{ color: '#94A3B8', fontSize: 18 }}>Estimated</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>≈ {
              fromToken === 'MON' && toToken === 'USDC' 
                ? (parseFloat(amount) * 12.5).toFixed(2)
                : fromToken === 'USDC' && toToken === 'MON'
                ? (parseFloat(amount) / 12.5).toFixed(6)
                : '0.00'
            }</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(59, 130, 246, 0.2)',
              padding: '8px 16px',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <span style={{ fontSize: 18, marginRight: 8 }}>{toToken}</span>
              <span style={{ fontSize: 18 }}>▼</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.2)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#FCA5A5',
            fontSize: 18,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Rate</span>
            <span style={{ color: 'white', fontSize: 16 }}>
              1 {fromToken} = {
                fromToken === 'MON' && toToken === 'USDC' 
                  ? '12.50'
                  : fromToken === 'USDC' && toToken === 'MON'
                  ? '0.080'
                  : '0.00'
              } {toToken}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Slippage</span>
            <span style={{ color: 'white', fontSize: 16 }}>0.5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateTokenSelectScreen(props: { selectingFrom?: boolean }) {
  const { selectingFrom = true } = props;
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        color: 'white',
        padding: 40,
        fontFamily,
      }}
    >
      <div style={{ 
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: 40, 
          marginRight: 10,
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
          borderRadius: '50%',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          💹
        </div>
        <h1 style={{ 
          fontSize: 40, 
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)', 
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          margin: 0 
        }}>
          JIKUNA SWAP
        </h1>
      </div>
      
      <div style={{
        width: '100%',
        maxWidth: 800,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
        padding: 40,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h2 style={{ 
          fontSize: 32, 
          marginBottom: 30,
          color: 'white',
          textAlign: 'center'
        }}>
          Choose {selectingFrom ? 'Input' : 'Output'} Token
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <TokenOption symbol="MON" name="Monad" balance="0.452" />
          <TokenOption symbol="WMON" name="Wrapped Monad" balance="0.000" />
          <TokenOption symbol="USDC" name="USD Coin" balance="25.00" />
          <TokenOption symbol="USDT" name="Tether USD" balance="10.00" />
        </div>
      </div>
    </div>
  );
}

function TokenOption({ symbol, name, balance }: { symbol: string; name: string; balance: string }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          background: 'rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          fontSize: 20,
        }}>
          {symbol === 'MON' || symbol === 'WMON' ? '⚡' : '💵'}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{symbol}</div>
          <div style={{ fontSize: 14, color: '#94A3B8' }}>{name}</div>
        </div>
      </div>
      <div style={{ fontSize: 18 }}>{balance}</div>
    </div>
  );
}

function generateConfirmSwapScreen(props: { fromToken?: string, toToken?: string, amount?: string }) {
  const { fromToken = 'MON', toToken = 'USDC', amount = '0.1' } = props;
  const toAmount = fromToken === 'MON' && toToken === 'USDC' 
    ? (parseFloat(amount) * 12.5).toFixed(2)
    : fromToken === 'USDC' && toToken === 'MON'
    ? (parseFloat(amount) / 12.5).toFixed(6)
    : '0.00';
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        color: 'white',
        padding: 40,
        fontFamily,
      }}
    >
      <div style={{ 
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: 40, 
          marginRight: 10,
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
          borderRadius: '50%',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          💹
        </div>
        <h1 style={{ 
          fontSize: 40, 
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)', 
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          margin: 0 
        }}>
          JIKUNA SWAP
        </h1>
      </div>
      
      <div style={{
        width: '100%',
        maxWidth: 800,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
        padding: 40,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h2 style={{ 
          fontSize: 36, 
          marginBottom: 30,
          color: 'white',
          textAlign: 'center'
        }}>
          Confirm Swap
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            marginBottom: 15,
          }}>
            <div style={{ 
              marginRight: 8, 
              fontSize: 20, 
              backgroundColor: 'rgba(59, 130, 246, 0.2)', 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {fromToken === 'MON' || fromToken === 'WMON' ? '⚡' : '💵'}
            </div>
            {amount} {fromToken}
          </div>
          
          <div style={{ fontSize: 24, margin: '10px 0' }}>⬇️</div>
          
          <div style={{
            fontSize: 24,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{ 
              marginRight: 8, 
              fontSize: 20, 
              backgroundColor: 'rgba(59, 130, 246, 0.2)', 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {toToken === 'MON' || toToken === 'WMON' ? '⚡' : '💵'}
            </div>
            {toAmount} {toToken}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Rate</span>
            <span style={{ color: 'white', fontSize: 16 }}>
              1 {fromToken} = {
                fromToken === 'MON' && toToken === 'USDC' 
                  ? '12.50'
                  : fromToken === 'USDC' && toToken === 'MON'
                  ? '0.080'
                  : '0.00'
              } {toToken}
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Fee</span>
            <span style={{ color: 'white', fontSize: 16 }}>0.3%</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Slippage</span>
            <span style={{ color: 'white', fontSize: 16 }}>0.5%</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#94A3B8', fontSize: 16 }}>Minimum received</span>
            <span style={{ color: 'white', fontSize: 16 }}>{(parseFloat(toAmount) * 0.995).toFixed(toToken === 'USDC' ? 2 : 6)} {toToken}</span>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: 5,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#3B82F6'
          }}>
            <span style={{ marginRight: 8 }}>ℹ️</span>
            Bonus JXP Rewards
          </div>
          <div style={{ fontSize: 16, color: '#94A3B8' }}>
            You will earn +5 Jikuna XtraPoints from this transaction.
          </div>
        </div>
      </div>
    </div>
  );
}

// Handling function for various Frame image types
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const screen = searchParams.get('screen') || 'main';
    
    console.log(`Generating frame image for screen: ${screen}`);
    console.log(`URL: ${req.url}`);
    console.log(`Search params: ${JSON.stringify(Object.fromEntries(searchParams.entries()))}`);
    
    let imageJsx: React.ReactElement;
    
    switch (screen) {
      case 'swap':
        imageJsx = generateSwapScreen({
          fromToken: searchParams.get('fromToken') || undefined,
          toToken: searchParams.get('toToken') || undefined,
          amount: searchParams.get('amount') || undefined,
          error: searchParams.get('error') || undefined,
        });
        break;
      case 'tokenSelect':
        imageJsx = generateTokenSelectScreen({
          selectingFrom: searchParams.get('selectingFrom') === 'true',
        });
        break;
      case 'confirmSwap':
        imageJsx = generateConfirmSwapScreen({
          fromToken: searchParams.get('fromToken') || undefined,
          toToken: searchParams.get('toToken') || undefined,
          amount: searchParams.get('amount') || undefined,
        });
        break;
      // Implement other functions as needed
      default:
        imageJsx = generateMainScreen();
    }
    
    // Render image response
    console.log(`Rendering image for screen: ${screen}`);
    return new ImageResponse(imageJsx, {
      width: IMG_WIDTH,
      height: IMG_HEIGHT,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Fallback image if an error occurs
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            color: 'white',
            padding: 40,
            fontFamily,
          }}
        >
          <h1 style={{ fontSize: 50, marginBottom: 20 }}>Jikuna Swap</h1>
          <p style={{ fontSize: 24, color: 'red' }}>Error generating frame image</p>
          <p style={{ fontSize: 18, color: 'red', maxWidth: '80%', textAlign: 'center' }}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      ),
      {
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
      }
    );
  }
}