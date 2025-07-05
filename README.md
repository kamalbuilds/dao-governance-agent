# 🤖 AI Portfolio Rebalancer | NEAR Protocol

An intelligent, AI-powered cross-chain portfolio rebalancing platform that uses natural language processing to understand user intents and execute sophisticated trading strategies across multiple blockchain networks.

## 🌟 Features

### 🧠 AI-Powered Intent Processing
- **Natural Language Understanding**: Describe your portfolio goals in plain English
- **Smart Strategy Classification**: AI automatically categorizes your intent (conservative, aggressive, DeFi-focused, etc.)
- **Risk Assessment**: Intelligent risk analysis with confidence scoring
- **Market Context**: Real-time market sentiment integration

### ⛓️ Blockchain Integration
- **NEAR Protocol Smart Contracts**: On-chain intent storage and execution
- **Wallet Integration**: Connect your NEAR wallet for seamless transactions
- **Cross-Chain Support**: Execute trades across Ethereum, NEAR, Polygon, Arbitrum, and Optimism
- **Gas Optimization**: Intelligent gas estimation and cost optimization

### 📊 Portfolio Management
- **Real-time Portfolio Tracking**: Monitor your assets across multiple chains
- **Health Analysis**: Comprehensive portfolio health scoring (A-F grades)
- **Diversification Metrics**: Advanced risk and diversification analysis
- **Automated Rebalancing**: Set thresholds for automatic portfolio adjustments

### 💡 User Experience
- **Interactive Dashboard**: Beautiful, responsive interface with real-time data
- **Intent History**: Track all your portfolio decisions and outcomes
- **Quick Actions**: Pre-built intent buttons for common strategies
- **Preference Learning**: AI learns from your decisions to improve recommendations

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- NEAR Wallet (for blockchain features)
- OpenAI API Key (for AI features)

### Installation

1. **Clone and Install**
```bash
cd shade-agent-template
bun install
```

2. **Start Development Server**
```bash
# Easy way - use the provided script
./start-dev.sh

# Or manually with environment variables
OPENAI_API_KEY=your_key_here \
NEXT_PUBLIC_CONTRACT_NAME=dao-aiagent.testnet \
NEXT_PUBLIC_NETWORK_ID=testnet \
bun run dev
```

3. **Open Your Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

### 1. Connect Your Wallet
- Click "Connect NEAR Wallet" to link your NEAR account
- This enables on-chain portfolio storage and trade execution

### 2. Set Up Your Portfolio
- View your current portfolio or use the demo data
- Click "Save to Blockchain" to store your portfolio on-chain
- Configure your preferences (risk tolerance, rebalance thresholds, etc.)

### 3. Submit Natural Language Intents
Try these example intents:
- "Make my portfolio more conservative"
- "I want higher returns, increase risk"
- "Focus on DeFi opportunities"
- "Diversify across multiple chains"
- "Reduce my exposure to volatile assets"

### 4. Review AI Analysis
The AI will provide:
- Strategy classification and confidence score
- Risk assessment and timeframe
- Recommended asset allocations
- Gas cost estimates
- Detailed reasoning

### 5. Execute Rebalancing
- Review the AI's recommendations
- Click "Execute Rebalance" to implement changes
- Monitor execution progress in real-time
- Portfolio updates automatically save to blockchain

## 🏗️ Architecture

### Smart Contract Integration
- **Contract Address**: `dao-aiagent.testnet`
- **Network**: NEAR Testnet
- **Functions**: Portfolio storage, intent processing, trade execution

### AI Pipeline
1. **Intent Processing**: OpenAI GPT-4o-mini analyzes natural language
2. **Strategy Generation**: AI determines optimal allocation strategies
3. **Risk Assessment**: Comprehensive risk scoring and analysis
4. **Execution Planning**: Step-by-step trade execution planning

### Frontend Stack
- **Next.js 14**: React framework with server-side rendering
- **NEAR API JS**: Blockchain integration and wallet connectivity
- **Modern CSS**: Responsive design with glassmorphism effects
- **Real-time Updates**: Live portfolio and market data

## 🔧 Configuration

### Environment Variables
```bash
# NEAR Configuration
NEXT_PUBLIC_CONTRACT_NAME=dao-aiagent.testnet
NEXT_PUBLIC_NETWORK_ID=testnet

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=AI Portfolio Rebalancer
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Supported Networks
- **NEAR Protocol** (Primary)
- **Ethereum** (EVM)
- **Polygon** (EVM)
- **Arbitrum** (EVM)
- **Optimism** (EVM)

## 📱 API Endpoints

### `/api/analyze-intent`
Analyzes natural language portfolio intents
- **Method**: POST
- **Body**: `{ intent, portfolio, preferences }`
- **Response**: Strategy classification, risk assessment, recommendations

### `/api/portfolio-health`
Comprehensive portfolio health analysis
- **Method**: POST
- **Body**: `{ portfolio }`
- **Response**: Health grade, diversification score, risk metrics

## 🧪 Testing

Run the comprehensive test suite:
```bash
bun run test
```

Test coverage includes:
- Natural language intent analysis
- Portfolio health calculations
- Strategy generation algorithms
- Risk assessment accuracy
- Gas estimation precision
- Error handling robustness

## 🔒 Security

- **Non-custodial**: Your assets remain in your wallet
- **Read-only Analysis**: AI analyzes without accessing private keys
- **Secure Connections**: All API calls use HTTPS
- **Smart Contract Auditing**: Contract code is open-source and auditable

## 🌐 Supported Assets

### NEAR Ecosystem
- NEAR, wNEAR, USDC.e, USDT.e, DAI, wETH, wBTC

### Ethereum Ecosystem
- ETH, USDC, USDT, DAI, wBTC, LINK, UNI, AAVE, COMP

### Cross-Chain Assets
- Automatically detected based on your wallet connections

## 📈 Advanced Features

### Portfolio Health Scoring
- **Grade A**: Excellent diversification, low risk
- **Grade B**: Good balance, moderate risk
- **Grade C**: Acceptable risk, some concentration
- **Grade D**: High risk, poor diversification
- **Grade F**: Dangerous concentration, immediate action needed

### AI Strategy Types
- **Conservative**: Focus on stable assets, low volatility
- **Aggressive**: High-growth potential, higher risk tolerance
- **DeFi-Focused**: Yield farming and liquidity provision
- **Cross-Chain**: Diversification across multiple networks
- **Market-Based**: Responsive to current market conditions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord for discussions
- **Email**: Contact us at support@shade-agent.com

## 🔮 Roadmap

- [ ] Multi-wallet support (MetaMask, WalletConnect)
- [ ] Advanced DeFi strategies (yield farming, liquidity provision)
- [ ] Mobile app (React Native)
- [ ] Institutional features (multi-signature, compliance)
- [ ] AI model fine-tuning on user feedback
- [ ] Advanced charting and analytics
- [ ] Social trading features
- [ ] Automated dollar-cost averaging

---

**Built with ❤️ for the NEAR Protocol "Agentic Internet" Challenge**

*Empowering users to manage their crypto portfolios with AI-driven insights and cross-chain execution capabilities.*
