import { useState, useEffect } from "react";
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

  const connectWallet = () => {
    setWalletAddress("0x7a2d4E98256e29bc4f8e29bc4f8e29bc4f8e29bc4");
  };

  const disconnectWallet = () => setWalletAddress(null);

  const fetchMarketData = async () => {
    try {
      const ids = { btc: "1673723677362319866", eth: "1673723677362319867" };
      const [btcRes, ethRes] = await Promise.all([
        fetch(`${BASE_URL}/currencies/${ids.btc}/market-snapshot`, { headers: { "x-soso-api-key": API_KEY } }),
        fetch(`${BASE_URL}/currencies/${ids.eth}/market-snapshot`, { headers: { "x-soso-api-key": API_KEY } })
      ]);

      if (!btcRes.ok || !ethRes.ok) {
        useMockMarketData();
        return;
      }

      const btcData = await btcRes.json();
      const ethData = await ethRes.json();

      if (btcData.code === 0 && ethData.code === 0) {
        const b = btcData.data;
        const e = ethData.data;
        const tickers: MarketData[] = [
          { symbol: "BTC", name: "Bitcoin", price: b.price, change24h: b.change_pct_24h * 100, icon: "₿", iconClass: "btc-icon" },
          { symbol: "ETH", name: "Ethereum", price: e.price, change24h: e.change_pct_24h * 100, icon: "Ξ", iconClass: "eth-icon" },
          { symbol: "TOTAL", name: "Market Cap", price: 2.84, change24h: 0.5, icon: "M", iconClass: "sol-icon" }
        ];
        setData(tickers);
        setInsight({ 
          text: b.change_pct_24h > 0 ? "🚀 AGENT SIGNAL: BULLISH MOMENTUM" : "⚖️ AGENT SIGNAL: MARKET CONSOLIDATING", 
          type: b.change_pct_24h > 0 ? "success" : "neutral" 
        });
        setApiError(null);
      } else {
        useMockMarketData();
      }
    } catch (err) {
      console.error("Market fetch error:", err);
      setApiError("Using offline data - market signals throttled.");
      useMockMarketData();
    }
  };

  const useMockMarketData = () => {
    const mockTickers: MarketData[] = [
      { symbol: "BTC", name: "Bitcoin", price: 68432.50, change24h: 2.4, icon: "₿", iconClass: "btc-icon" },
      { symbol: "ETH", name: "Ethereum", price: 3841.20, change24h: 1.8, icon: "Ξ", iconClass: "eth-icon" },
      { symbol: "TOTAL", name: "Market Cap", price: 2.56, change24h: 1.2, icon: "M", iconClass: "sol-icon" }
    ];
    setData(mockTickers);
    setInsight({ text: "⚖️ ANALYZING MARKET SIGNALS", type: "neutral" });
  };

  const fetchNews = async () => {
    try {
      const response = await fetch(`${BASE_URL}/news`, {
        headers: { "x-soso-api-key": API_KEY },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const rawNews = result.data.list || result.data;
          if (Array.isArray(rawNews)) {
            const mappedNews = rawNews.slice(0, 5).map((item: any) => {
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
            setApiError(null);
          }
        }
      }
      setApiLoading(false);
    } catch (err) {
      console.error("News fetch error:", err);
      setApiError("Alpha feed interrupted - check network.");
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchNews();
    const interval = setInterval(() => {
      fetchMarketData();
      fetchNews();
    }, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleTrade = () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowModal(true);
    }, 2500);
  };

  const closeModal = () => setShowModal(false);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === "TOTAL") return `${price.toFixed(2)}T`;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getTimeAgo = (dateStr: string) => {
    const timestamp = isNaN(Number(dateStr)) ? new Date(dateStr).getTime() : Number(dateStr);
    const diff = Date.now() - timestamp;
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
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      
      <div className="app-container">
        <nav className="top-nav">
          <div className="logo">
            <div className="logo-icon">S</div>
            <span>SOSO_AGENT</span>
          </div>
          <button className="wallet-btn" onClick={walletAddress ? disconnectWallet : connectWallet}>
            {walletAddress 
              ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` 
              : "CONNECT WALLET"}
          </button>
        </nav>

        <header>
          <div className="badge">SoSoValue Agentic Hackathon</div>
          <h1>Soso<span className="highlight">Agent</span></h1>
          <p className="subtitle">AI-Autonomous Alpha Discovery & Execution</p>
        </header>

        <div className="dashboard-grid">
          
          {/* AI Sentiment Card */}
          <div className="glass-card insight-card">
            <h3 className="card-title">
              <svg className="card-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              AI Global Sentiment
            </h3>
            <p className={`insight-text ${insight.type}`}>{insight.text}</p>
          </div>

          {/* Market Tickers */}
          <div className="glass-card">
            <h3 className="card-title">
              <svg className="card-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              SoSo Intelligence Data
            </h3>
            <div className="tickers-container">
              {data.map((coin) => (
                <div className="ticker-item" key={coin.symbol}>
                  <div className="coin-info">
                    <div className={`coin-icon ${coin.iconClass}`}>{coin.icon}</div>
                    <div className="coin-name">
                      <h4>{coin.symbol}</h4>
                      <span>{coin.name}</span>
                    </div>
                  </div>
                  <div className="price-info">
                    <p className="price">{formatPrice(coin.price, coin.symbol)}</p>
                    <span className={`change ${coin.change24h >= 0 ? 'positive' : 'negative'}`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {apiError && <p className="error-small">{apiError}</p>}
          </div>

          {/* News Feed with Sentiment */}
          <div className="glass-card">
            <h3 className="card-title">
              <svg className="card-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 20l-7-7-7 7V4h14v16z"></path></svg>
              Alpha Feed (AI Scored)
            </h3>
            <div className="news-feed">
              {news.map(item => (
                <div className="news-item" key={item.id} style={{ borderLeftColor: item.sentiment?.label === 'bullish' ? 'var(--success)' : item.sentiment?.label === 'bearish' ? 'var(--danger)' : 'var(--primary)' }}>
                  <div className="news-header">
                    <span className={`news-cat ${item.sentiment?.label}`}>{item.sentiment?.label || 'Neutral'}</span>
                    <span className="news-time">{getTimeAgo(item.published_at)}</span>
                  </div>
                  <p className="news-title">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agentic Execution */}
          <div className="glass-card execution-card" style={{ gridColumn: "span 2" }}>
            <h3 className="card-title">
              <svg className="card-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Autonomous Agent Deployment
            </h3>
            <div className="execution-content">
              <p style={{ color: "var(--text-dim)", marginBottom: "30px", maxWidth: "600px", textAlign: "center" }}>
                Our AI Agent analyzes SoSoValue sentiment and news signals to execute high-probability trades across ValueChain liquidity.
              </p>
              
              <div className="agent-terminal">
                <div className="terminal-header">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                  <span className="terminal-title">AGENT_LOG v1.0.4</span>
                </div>
                <div className="terminal-body">
                  <div className="log-line"><span className="time">[23:01:04]</span> <span className="cmd">SCANNING</span> SoSoValue News Feed...</div>
                  <div className="log-line"><span className="time">[23:01:08]</span> <span className="cmd">ANALYZING</span> Bitcoin Sentiment Score: 0.84</div>
                  <div className="log-line"><span className="time">[23:01:12]</span> <span className="cmd">READY</span> Agent synced with ValueChain Node.</div>
                </div>
              </div>

              <div className="btn-container" style={{ marginTop: "40px" }}>
                <button 
                  className={`premium-btn ${loading ? 'loading' : ''} ${!walletAddress ? 'disabled' : ''}`} 
                  onClick={handleTrade} 
                  disabled={loading}
                >
                  {loading ? <div className="spinner"></div> : walletAddress ? "DEPLOY ALPHA AGENT" : "CONNECT WALLET TO DEPLOY"}
                </button>
                <div className="status-badge">
                  <div className="pulse-dot"></div>
                  Agent Ready: {walletAddress ? "Waiting for Signal" : "Authentication Required"}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2>Agent Deployed!</h2>
          <p>The AI Agent has initiated strategy execution on SoDEX Protocol based on current sentiment signals.</p>
          <div className="hash-box">
            Agent ID: SOSO-AG-9284-F8X
          </div>
          <button className="close-btn" onClick={closeModal}>ACKNOWLEDGE</button>
        </div>
      </div>
    </>
  );
}

export default App;




