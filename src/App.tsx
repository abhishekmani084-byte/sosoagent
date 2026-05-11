import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_SOSO_API_KEY;
const BASE_URL = "/soso-api/openapi/v1";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  iconClass: string;
}

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
  source: string;
  sentiment: {
    label: string;
    score: number;
  };
}

function App() {
  const [data, setData] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [insight, setInsight] = useState({ text: "Initializing AI Agent...", type: "neutral" });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [balance, setBalance] = useState<number>(10000);
  const [strategy] = useState<string>("Aggressive");
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [holdings, setHoldings] = useState<{symbol: string, amount: number, entry: number, timestamp: number}[]>([]);
  const [stats, setStats] = useState({ totalTrades: 0, totalVolume: 0 });
  const [sessionStart] = useState<number>(() => Date.now());
  const [currentTime, setCurrentTime] = useState<number>(sessionStart);
  const [overallSentiment, setOverallSentiment] = useState<number>(65); // Default to 65 (Greed)

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getSessionDuration = () => {
    const diff = currentTime - sessionStart;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };
  const [logs, setLogs] = useState<{time: string, cmd: string, msg: string}[]>([
    { time: new Date().toLocaleTimeString(), cmd: "SYSTEM", msg: "Agentic Kernel v2.1.0 loaded." }
  ]);

  const addLog = (cmd: string, msg: string) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), cmd, msg }, ...prev].slice(0, 20));
  };

  const calculateTotalPnL = () => {
    return holdings.reduce((acc, h) => {
      const current = data.find(d => d.symbol === h.symbol)?.price || h.entry;
      return acc + (current - h.entry) * h.amount;
    }, 0);
  };

  const connectWallet = () => {
    setWalletAddress("0x7a2d4E98256e29bc4f8e29bc4f8e29bc4f8e29bc4");
    addLog("AUTH", "Secure handshake established with 0x7a2d...bc4");
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    addLog("AUTH", "Session terminated by user.");
  };

  const applyMockMarketData = useCallback(() => {
    const mockTickers: MarketData[] = [
      { symbol: "BTC", name: "Bitcoin", price: 68432.50, change24h: 2.4, icon: "₿", iconClass: "btc-icon" },
      { symbol: "ETH", name: "Ethereum", price: 3841.20, change24h: 1.8, icon: "Ξ", iconClass: "eth-icon" },
      { symbol: "SOL", name: "Solana", price: 145.20, change24h: 5.2, icon: "S", iconClass: "sol-icon" }
    ];
    setData(mockTickers);
    setInsight({ text: "ANALYZING MARKET SIGNALS", type: "neutral" });
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      addLog("SYNC", "Refreshing live oracle feeds...");
      const ids = { btc: "1673723677362319866", eth: "1673723677362319867", sol: "1673723677362319875" };
      const [btcRes, ethRes, solRes] = await Promise.all([
        fetch(`${BASE_URL}/currencies/${ids.btc}/market-snapshot`, { headers: { "x-soso-api-key": API_KEY } }),
        fetch(`${BASE_URL}/currencies/${ids.eth}/market-snapshot`, { headers: { "x-soso-api-key": API_KEY } }),
        fetch(`${BASE_URL}/currencies/${ids.sol}/market-snapshot`, { headers: { "x-soso-api-key": API_KEY } })
      ]);

      if (!btcRes.ok || !ethRes.ok || !solRes.ok) {
        applyMockMarketData();
        return;
      }
      const btcData = await btcRes.json();
      const ethData = await ethRes.json();
      const solData = await solRes.json();

      if (btcData.code === 0 && ethData.code === 0 && solData.code === 0) {
        const b = btcData.data;
        const e = ethData.data;
        const s = solData.data;
        const tickers: MarketData[] = [
          { symbol: "BTC", name: "Bitcoin", price: b.price, change24h: b.change_pct_24h * 100, icon: "₿", iconClass: "btc-icon" },
          { symbol: "ETH", name: "Ethereum", price: e.price, change24h: e.change_pct_24h * 100, icon: "Ξ", iconClass: "eth-icon" },
          { symbol: "SOL", name: "Solana", price: s.price, change24h: s.change_pct_24h * 100, icon: "S", iconClass: "sol-icon" }
        ];
        setData(tickers);
        setInsight({ 
          text: b.change_pct_24h > 0 ? "BULLISH MOMENTUM" : "MARKET CONSOLIDATING", 
          type: b.change_pct_24h > 0 ? "success" : "neutral" 
        });
        setApiError(null);
      } else {
        applyMockMarketData();
      }
    } catch (err) {
      console.error("Market fetch error:", err);
      setApiError("Using offline data - market signals throttled.");
      applyMockMarketData();
    }
  }, [applyMockMarketData]);



  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/news`, {
        headers: { "x-soso-api-key": API_KEY },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const rawNews = result.data.list || result.data;
          if (Array.isArray(rawNews)) {
            const mappedNews = rawNews.slice(0, 5).map((item: {id: string, title?: string, content?: string, release_time?: string, author?: string}) => {
              const text = (item.title || item.content || "").toLowerCase();
              let label = "neutral";
              if (text.includes("surge") || text.includes("bullish") || text.includes("up") || text.includes("rise") || text.includes("gain")) label = "bullish";
              if (text.includes("crash") || text.includes("bearish") || text.includes("down") || text.includes("fall") || text.includes("loss")) label = "bearish";
              
              return {
                id: item.id,
                title: item.title || (item.content?.substring(0, 80) + "..."),
                published_at: item.release_time || new Date().toISOString(),
                source: item.author || "Global Feed",
                sentiment: { label, score: label === "bullish" ? 0.8 : label === "bearish" ? 0.2 : 0.5 }
              };
            });
            setNews(mappedNews);
            
            // Calculate overall sentiment score (0-100)
            const totalScore = mappedNews.reduce((acc: number, item: any) => acc + item.sentiment.score, 0);
            const avgScore = (totalScore / mappedNews.length) * 100;
            setOverallSentiment(Math.round(avgScore));
            
            setApiError(null);
          }
        }
      }
      setApiLoading(false);
    } catch (err) {
      console.error("News fetch error:", err);
      const mockNews: NewsItem[] = [
        { id: "1", title: "Bitcoin signals strength as institutional interest grows.", published_at: new Date().toISOString(), source: "Market Pulse", sentiment: { label: "bullish", score: 0.8 } },
        { id: "2", title: "Regulatory discussions heat up in major economies.", published_at: new Date().toISOString(), source: "Global Feed", sentiment: { label: "neutral", score: 0.5 } },
        { id: "3", title: "New DeFi protocol launches on Solana mainnet.", published_at: new Date().toISOString(), source: "Alpha Scan", sentiment: { label: "bullish", score: 0.7 } }
      ];
      setNews(mockNews);
      setApiError("Using cached alpha feed - live signals throttled.");
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await fetchMarketData();
      await fetchNews();
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, [fetchMarketData, fetchNews]);

  const handleTrade = () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    if (balance < 1000) {
      alert("Insufficient liquidity for new deployment.");
      return;
    }

    setLoading(true);
    addLog("EXEC", `Initiating ${strategy} sequence for ${selectedAsset}...`);
    
    setTimeout(() => {
      const target = data.find(d => d.symbol === selectedAsset) || data[0];
      
      addLog("RISK", `Asset: ${target.symbol} | Strategy: ${strategy} | Mode: Manual Target`);
      addLog("SIGNAL", `Optimizing entry for ${target.symbol} via SoSo Intelligence.`);
      
      setTimeout(() => {
        const currentPrice = target.price;
        const tradeAmount = target.symbol === "BTC" ? 0.02 : target.symbol === "ETH" ? 0.5 : 10;
        const cost = tradeAmount * currentPrice;
        
        const hash = "0x" + Math.random().toString(16).slice(2, 10).toUpperCase() + "..." + Math.random().toString(16).slice(2, 6).toUpperCase();
        setTxHash(hash);

        setBalance(prev => prev - cost);
        setHoldings(prev => [
          { symbol: target.symbol, amount: tradeAmount, entry: currentPrice, timestamp: Date.now() },
          ...prev
        ].slice(0, 5));

        setStats(prev => ({
          totalTrades: prev.totalTrades + 1,
          totalVolume: prev.totalVolume + cost
        }));

        addLog("TRADE", `Executed BUY: ${tradeAmount} ${target.symbol} @ $${currentPrice.toLocaleString()}`);
        
        setTimeout(() => {
          setLoading(false);
          setShowModal(true);
          addLog("CONFIRM", `Transaction finalized on-chain. Receipt: ${hash}`);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const closePosition = (symbol: string, index: number) => {
    const pos = holdings[index];
    const currentPrice = data.find(d => d.symbol === symbol)?.price || pos.entry;
    const pnl = (currentPrice - pos.entry) * pos.amount;
    const totalReturn = (pos.entry * pos.amount) + pnl;

    setBalance(prev => prev + totalReturn);
    setHoldings(prev => prev.filter((_, i) => i !== index));
    addLog("EXIT", `Closed ${symbol} position. Final P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  };

  const closeModal = () => setShowModal(false);



  const getTimeAgo = (dateStr: string) => {
    const timestamp = isNaN(Number(dateStr)) ? new Date(dateStr).getTime() : Number(dateStr);
    const diff = currentTime - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 0) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (apiLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-large" />
        <p className="loading-text">Synchronizing with SoSo Intelligence...</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-bg"></div>
      <div className="ambient-grid"></div>
      
      <div className="app-container">
        <nav className="top-nav">
          <div className="logo">
            <div className="logo-symbol">S</div>
            <span>SOSO_AGENT</span>
          </div>
          <button className="wallet-btn" onClick={walletAddress ? disconnectWallet : connectWallet}>
            {walletAddress 
              ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` 
              : "CONNECT WALLET"}
          </button>
        </nav>

        <header>
          <div className="hack-badge">
            <span className="pulse-dot"></span>
            SoSoValue Buildathon 2026
          </div>
          <h1>Soso<span className="highlight">Agent</span></h1>
          <p className="subtitle">AI-Autonomous Alpha Discovery & Execution</p>
          {apiError && <div className="api-error-notice">{apiError}</div>}
        </header>

        <div className="dashboard-grid">
          
          {/* Portfolio Card */}
          <div className="glass-card portfolio-card">
            <h3 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Institutional Portfolio
            </h3>
            <div className="balance-wrap">
              <span className="pos-meta">Net Liquid Assets</span>
              <h2>${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
              <div className={`pnl-badge ${calculateTotalPnL() >= 0 ? 'positive' : 'negative'}`}>
                {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL().toFixed(2)} Live Profit
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <span className="pos-meta">Avg Trade</span>
                <p>${stats.totalTrades > 0 ? (stats.totalVolume / stats.totalTrades).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}</p>
              </div>
              <div className="stat-box">
                <span className="pos-meta">Trades</span>
                <p>{stats.totalTrades}</p>
              </div>
              <div className="stat-box">
                <span className="pos-meta">Session</span>
                <p>{getSessionDuration()}</p>
              </div>
            </div>
            
            <div className="positions-list">
              <h4 className="card-title" style={{fontSize: '0.7rem', marginTop: '20px'}}>Live Positions</h4>
              {holdings.length === 0 ? (
                <p className="pos-meta">No active agent positions</p>
              ) : (
                holdings.map((h, i) => {
                  const currentPrice = data.find(d => d.symbol === h.symbol)?.price || h.entry;
                  const pnl = (currentPrice - h.entry) * h.amount;
                  const holdTime = Math.floor((currentTime - h.timestamp) / 1000);
                  return (
                    <div className="position-row" key={i}>
                      <div style={{flex: 1}}>
                        <div className="pos-coin">{h.symbol} <span className="pnl-small" style={{color: pnl >= 0 ? 'var(--success)' : 'var(--danger)'}}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</span></div>
                        <div className="pos-meta">{h.amount} units | {holdTime}s ago</div>
                      </div>
                      <div style={{textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div>
                          <div className="pos-coin">${currentPrice.toLocaleString()}</div>
                          <div className="pos-meta">Market</div>
                        </div>
                        <button className="exit-btn" onClick={() => closePosition(h.symbol, i)}>EXIT</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Middle Column */}
          <div className="middle-col">
            <div className="glass-card sentiment-hero">
               <h3 className="card-title" style={{justifyContent: 'center'}}>Market Intelligence</h3>
               <div className={`insight-val ${insight.type}`}>{insight.text}</div>
               <div className="health-bar-wrap">
                 <div className="health-info">
                   <span className="pos-meta">Network Health</span>
                   <span className="pos-meta" style={{color: 'var(--success)'}}>98% STABLE</span>
                 </div>
                 <div className="health-bar">
                   <div className="health-fill" style={{width: '98%'}}></div>
                 </div>
               </div>
               
               <div className="sentiment-meter-wrap">
                 <div className="meter-labels">
                   <span className="pos-meta">FEAR</span>
                   <span className="meter-value">{overallSentiment}</span>
                   <span className="pos-meta">GREED</span>
                 </div>
                 <div className="meter-bar">
                   <div className="meter-track"></div>
                   <div 
                     className="meter-indicator" 
                     style={{ 
                       left: `${overallSentiment}%`,
                       background: overallSentiment > 50 ? 'var(--success)' : 'var(--danger)',
                       boxShadow: `0 0 15px ${overallSentiment > 50 ? 'var(--success)' : 'var(--danger)'}`
                     }}
                   ></div>
                 </div>
                 <p className="pos-meta" style={{marginTop: '10px'}}>
                   Aggregate SoSo Intelligence Sentiment Index
                 </p>
               </div>
            </div>

            <div className="ticker-grid">
              {data.map(coin => (
                <div className="mini-ticker" key={coin.symbol}>
                  <h5>{coin.symbol}</h5>
                  <p>${coin.price.toLocaleString()}</p>
                  <span className={`news-label ${coin.change24h >= 0 ? 'bullish' : 'bearish'}`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: News */}
          <div className="news-col">
            <div className="glass-card" style={{height: '100%'}}>
              <h3 className="card-title">Alpha Feed</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {news.map(item => (
                  <div className="news-card" key={item.id}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span className={`news-label ${item.sentiment.label}`}>{item.sentiment.label}</span>
                      <span className="pos-meta">{getTimeAgo(item.published_at)}</span>
                    </div>
                    <p className="news-text">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Terminal Section */}
          <div className="terminal-section">
            <div className="terminal-ui">
              <div className="term-head">
                <div className="term-controls">
                  <div className="t-dot red"></div>
                  <div className="t-dot yellow"></div>
                  <div className="t-dot green"></div>
                  <span className="terminal-title">AGENT_ORCHESTRATOR v2.1.0</span>
                </div>
                <div className="pos-meta">SYSTEM_STATUS: ACTIVE</div>
              </div>
              <div className="t-body">
                {logs.map((log, i) => (
                  <div className="l-row" key={i}>
                    <span className="l-time">[{log.time.split(' ')[0]}]</span>
                    <span className="l-cmd">{log.cmd}</span>
                    <span className="l-msg">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="deploy-panel">
              <div style={{maxWidth: '50%'}}>
                <h4 style={{margin: '0 0 5px'}}>Target Deployment</h4>
                <div className="asset-picker">
                  {data.map(coin => (
                    <button 
                      key={coin.symbol}
                      className={`picker-btn ${selectedAsset === coin.symbol ? 'active' : ''}`}
                      onClick={() => setSelectedAsset(coin.symbol)}
                    >
                      {coin.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                className="deploy-btn" 
                onClick={handleTrade}
                disabled={loading || !walletAddress}
              >
                {loading ? "EXECUTING..." : walletAddress ? "DEPLOY AGENT" : "CONNECT WALLET"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modern Modal */}
      <div className={`modal-bg ${showModal ? 'active' : ''}`}>
        <div className="modal-box">
          <div className="m-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{margin: '0 0 10px'}}>Agent Active</h2>
          <p className="pos-meta">The orchestrator has initiated your position on ValueChain.</p>
          <div className="m-hash">{txHash}</div>
          <button className="m-close" onClick={closeModal}>ACKNOWLEDGE</button>
        </div>
      </div>
    </>
  );
}

export default App;
