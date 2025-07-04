// AI-Powered Portfolio Analyzer
// This module provides AI analysis for portfolio rebalancing intents

class PortfolioAnalyzer {
    constructor() {
        this.marketData = new Map();
        this.analysisHistory = [];
    }

    /**
     * Parse natural language intent into actionable portfolio allocation
     * @param {string} intentText - Natural language intent
     * @param {Array} currentPortfolio - Current portfolio assets
     * @param {Object} userPreferences - User preferences and risk tolerance
     * @returns {Object} Parsed intent with target allocations
     */
    async parseIntent(intentText, currentPortfolio = [], userPreferences = {}) {
        const intent = intentText.toLowerCase();
        
        // AI Intent Parsing Logic
        let parsedAction = "unknown";
        let targetAllocations = [];
        let confidence = 0;

        // Risk-based rebalancing
        if (intent.includes("conservative") || intent.includes("safe") || intent.includes("low risk")) {
            parsedAction = "conservative_rebalance";
            targetAllocations = this.generateConservativeAllocation(currentPortfolio);
            confidence = 85;
        }
        // Aggressive growth
        else if (intent.includes("aggressive") || intent.includes("growth") || intent.includes("high risk")) {
            parsedAction = "aggressive_rebalance";
            targetAllocations = this.generateAggressiveAllocation(currentPortfolio);
            confidence = 80;
        }
        // Market-based rebalancing
        else if (intent.includes("market") || intent.includes("trend") || intent.includes("sentiment")) {
            parsedAction = "market_based_rebalance";
            targetAllocations = await this.generateMarketBasedAllocation(currentPortfolio);
            confidence = 75;
        }
        // DeFi focus
        else if (intent.includes("defi") || intent.includes("yield") || intent.includes("staking")) {
            parsedAction = "defi_rebalance";
            targetAllocations = this.generateDeFiAllocation(currentPortfolio);
            confidence = 70;
        }
        // Cross-chain diversification
        else if (intent.includes("cross") || intent.includes("chain") || intent.includes("diversify")) {
            parsedAction = "cross_chain_rebalance";
            targetAllocations = this.generateCrossChainAllocation(currentPortfolio);
            confidence = 78;
        }
        // Equal weight
        else if (intent.includes("equal") || intent.includes("balanced") || intent.includes("50/50")) {
            parsedAction = "equal_weight_rebalance";
            targetAllocations = this.generateEqualWeightAllocation(currentPortfolio);
            confidence = 90;
        }
        // Custom percentage allocation
        else if (intent.match(/\d+%/) || intent.includes("percent")) {
            parsedAction = "custom_allocation";
            targetAllocations = this.parseCustomAllocation(intent, currentPortfolio);
            confidence = 95;
        }

        return {
            parsedAction,
            targetAllocations,
            confidence,
            reasoning: this.generateReasoning(parsedAction, targetAllocations, userPreferences)
        };
    }

    /**
     * Generate conservative portfolio allocation (lower risk)
     */
    generateConservativeAllocation(currentPortfolio) {
        return [
            {
                symbol: "NEAR",
                chain: "near",
                contract_address: null,
                target_percentage: 30,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "ETH",
                chain: "ethereum",
                contract_address: null,
                target_percentage: 25,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDC",
                chain: "ethereum",
                contract_address: "0xA0b86a33E6441e8a3b3f4A5c7b2C2e4D8F5B6C7D",
                target_percentage: 35,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDT",
                chain: "near",
                contract_address: "usdt.tether-token.near",
                target_percentage: 10,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            }
        ];
    }

    /**
     * Generate aggressive portfolio allocation (higher risk, higher potential returns)
     */
    generateAggressiveAllocation(currentPortfolio) {
        return [
            {
                symbol: "NEAR",
                chain: "near",
                contract_address: null,
                target_percentage: 40,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "ETH",
                chain: "ethereum",
                contract_address: null,
                target_percentage: 35,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "REF",
                chain: "near",
                contract_address: "token.v2.ref-finance.near",
                target_percentage: 15,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDC",
                chain: "ethereum",
                contract_address: "0xA0b86a33E6441e8a3b3f4A5c7b2C2e4D8F5B6C7D",
                target_percentage: 10,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            }
        ];
    }

    /**
     * Generate market-based allocation using current market sentiment
     */
    async generateMarketBasedAllocation(currentPortfolio) {
        const marketSentiment = await this.analyzeMarketSentiment();
        
        if (marketSentiment === "bullish") {
            return this.generateAggressiveAllocation(currentPortfolio);
        } else if (marketSentiment === "bearish") {
            return this.generateConservativeAllocation(currentPortfolio);
        } else {
            return this.generateEqualWeightAllocation(currentPortfolio);
        }
    }

    /**
     * Generate DeFi-focused allocation
     */
    generateDeFiAllocation(currentPortfolio) {
        return [
            {
                symbol: "NEAR",
                chain: "near",
                contract_address: null,
                target_percentage: 25,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "REF",
                chain: "near",
                contract_address: "token.v2.ref-finance.near",
                target_percentage: 20,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "AURORA",
                chain: "near",
                contract_address: "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
                target_percentage: 15,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "ETH",
                chain: "ethereum",
                contract_address: null,
                target_percentage: 25,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDC",
                chain: "ethereum",
                contract_address: "0xA0b86a33E6441e8a3b3f4A5c7b2C2e4D8F5B6C7D",
                target_percentage: 15,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            }
        ];
    }

    /**
     * Generate cross-chain diversified allocation
     */
    generateCrossChainAllocation(currentPortfolio) {
        return [
            {
                symbol: "NEAR",
                chain: "near",
                contract_address: null,
                target_percentage: 30,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "ETH",
                chain: "ethereum",
                contract_address: null,
                target_percentage: 30,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDC",
                chain: "ethereum",
                contract_address: "0xA0b86a33E6441e8a3b3f4A5c7b2C2e4D8F5B6C7D",
                target_percentage: 20,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            },
            {
                symbol: "USDT",
                chain: "near",
                contract_address: "usdt.tether-token.near",
                target_percentage: 20,
                current_percentage: 0,
                current_value_usd: 0,
                last_updated: Date.now()
            }
        ];
    }

    /**
     * Generate equal weight allocation
     */
    generateEqualWeightAllocation(currentPortfolio) {
        const assets = ["NEAR", "ETH", "USDC", "REF"];
        const percentage = Math.floor(100 / assets.length);
        
        return assets.map(symbol => ({
            symbol,
            chain: symbol === "ETH" || symbol === "USDC" ? "ethereum" : "near",
            contract_address: this.getContractAddress(symbol),
            target_percentage: percentage,
            current_percentage: 0,
            current_value_usd: 0,
            last_updated: Date.now()
        }));
    }

    /**
     * Parse custom allocation from natural language
     */
    parseCustomAllocation(intent, currentPortfolio) {
        const allocations = [];
        const percentageMatches = intent.match(/(\w+)\s*(\d+)%/g);
        
        if (percentageMatches) {
            percentageMatches.forEach(match => {
                const [, symbol, percentage] = match.match(/(\w+)\s*(\d+)%/);
                allocations.push({
                    symbol: symbol.toUpperCase(),
                    chain: this.getChainForSymbol(symbol.toUpperCase()),
                    contract_address: this.getContractAddress(symbol.toUpperCase()),
                    target_percentage: parseInt(percentage),
                    current_percentage: 0,
                    current_value_usd: 0,
                    last_updated: Date.now()
                });
            });
        }
        
        return allocations;
    }

    /**
     * Analyze current market sentiment
     */
    async analyzeMarketSentiment() {
        try {
            // Simulate market sentiment analysis
            // In a real implementation, this would call external APIs
            const sentiments = ["bullish", "bearish", "neutral"];
            const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
            
            // Store market analysis
            const analysis = {
                timestamp: Date.now(),
                market_sentiment: randomSentiment,
                volatility_score: Math.floor(Math.random() * 100),
                recommended_action: this.getRecommendedAction(randomSentiment),
                confidence_score: Math.floor(Math.random() * 40) + 60, // 60-100
                analysis_data: JSON.stringify({
                    factors: ["price_momentum", "volume_analysis", "social_sentiment"],
                    indicators: {
                        rsi: Math.floor(Math.random() * 100),
                        macd: Math.random() > 0.5 ? "bullish" : "bearish",
                        moving_average: Math.random() > 0.5 ? "above" : "below"
                    }
                })
            };
            
            this.analysisHistory.push(analysis);
            return randomSentiment;
        } catch (error) {
            console.error("Market sentiment analysis failed:", error);
            return "neutral";
        }
    }

    /**
     * Get recommended action based on market sentiment
     */
    getRecommendedAction(sentiment) {
        switch (sentiment) {
            case "bullish":
                return "increase_risk_assets";
            case "bearish":
                return "increase_stable_assets";
            default:
                return "maintain_balance";
        }
    }

    /**
     * Generate reasoning for allocation decisions
     */
    generateReasoning(action, allocations, userPreferences) {
        const reasons = [];
        
        switch (action) {
            case "conservative_rebalance":
                reasons.push("Prioritizing capital preservation with higher stable asset allocation");
                reasons.push("Reduced exposure to volatile assets to minimize downside risk");
                break;
            case "aggressive_rebalance":
                reasons.push("Maximizing growth potential with higher allocation to growth assets");
                reasons.push("Accepting higher volatility for potential higher returns");
                break;
            case "market_based_rebalance":
                reasons.push("Adjusting allocation based on current market sentiment and trends");
                reasons.push("Dynamic rebalancing to capitalize on market opportunities");
                break;
            case "cross_chain_rebalance":
                reasons.push("Diversifying across multiple blockchain ecosystems");
                reasons.push("Reducing single-chain risk through cross-chain allocation");
                break;
            default:
                reasons.push("Balanced approach based on user intent and market conditions");
        }
        
        if (userPreferences.risk_tolerance) {
            reasons.push(`Aligned with ${userPreferences.risk_tolerance} risk tolerance`);
        }
        
        return reasons.join(". ");
    }

    /**
     * Get contract address for a symbol
     */
    getContractAddress(symbol) {
        const contracts = {
            "USDC": "0xA0b86a33E6441e8a3b3f4A5c7b2C2e4D8F5B6C7D",
            "USDT": "usdt.tether-token.near",
            "REF": "token.v2.ref-finance.near",
            "AURORA": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near"
        };
        return contracts[symbol] || null;
    }

    /**
     * Get chain for a symbol
     */
    getChainForSymbol(symbol) {
        const ethereumAssets = ["ETH", "USDC"];
        return ethereumAssets.includes(symbol) ? "ethereum" : "near";
    }

    /**
     * Get latest market analysis
     */
    getLatestAnalysis() {
        return this.analysisHistory[this.analysisHistory.length - 1] || null;
    }

    /**
     * Calculate portfolio rebalancing needs
     */
    calculateRebalanceNeeds(currentPortfolio, targetPortfolio, threshold = 5) {
        const rebalanceActions = [];
        
        for (const target of targetPortfolio) {
            const current = currentPortfolio.find(p => p.symbol === target.symbol);
            if (current) {
                const deviation = Math.abs(current.current_percentage - target.target_percentage);
                if (deviation > threshold) {
                    rebalanceActions.push({
                        symbol: target.symbol,
                        action: current.current_percentage > target.target_percentage ? "sell" : "buy",
                        deviation,
                        current_percentage: current.current_percentage,
                        target_percentage: target.target_percentage
                    });
                }
            }
        }
        
        return rebalanceActions;
    }
}

export default PortfolioAnalyzer; 