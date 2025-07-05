// AI-Powered Portfolio Analyzer with OpenAI Integration
// Processes natural language intents and provides intelligent portfolio recommendations

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

class AIPortfolioAnalyzer {
    constructor() {
        this.apiKey = OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        
        // Portfolio allocation strategies
        this.strategies = {
            conservative: {
                crypto: 20,
                stablecoins: 50,
                defi: 15,
                nfts: 5,
                cash: 10
            },
            moderate: {
                crypto: 40,
                stablecoins: 30,
                defi: 20,
                nfts: 5,
                cash: 5
            },
            aggressive: {
                crypto: 60,
                stablecoins: 15,
                defi: 20,
                nfts: 5,
                cash: 0
            },
            defi_focused: {
                crypto: 30,
                stablecoins: 20,
                defi: 45,
                nfts: 0,
                cash: 5
            },
            cross_chain: {
                ethereum: 40,
                near: 25,
                polygon: 15,
                arbitrum: 10,
                optimism: 10
            }
        };
        
        // Market sentiment indicators
        this.marketSentiment = {
            bullish: { confidence: 0.8, volatility: 'high' },
            bearish: { confidence: 0.7, volatility: 'high' },
            neutral: { confidence: 0.6, volatility: 'medium' },
            uncertain: { confidence: 0.4, volatility: 'very_high' }
        };
    }

    // Call OpenAI API for natural language processing
    async callOpenAI(prompt, maxTokens = 500) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert DeFi portfolio advisor. Analyze user intents for portfolio rebalancing and provide structured recommendations. Focus on crypto, DeFi, and cross-chain strategies.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API call failed:', error);
            // Fallback to local analysis
            return this.fallbackAnalysis(prompt);
        }
    }

    // Fallback analysis when OpenAI is unavailable
    fallbackAnalysis(intent) {
        const intentLower = intent.toLowerCase();
        
        if (intentLower.includes('conservative') || intentLower.includes('safe') || intentLower.includes('stable')) {
            return 'Conservative strategy recommended: Focus on stablecoins and established cryptocurrencies with lower volatility.';
        } else if (intentLower.includes('aggressive') || intentLower.includes('risky') || intentLower.includes('high return')) {
            return 'Aggressive strategy recommended: Higher allocation to growth cryptocurrencies and emerging DeFi protocols.';
        } else if (intentLower.includes('defi') || intentLower.includes('yield') || intentLower.includes('farming')) {
            return 'DeFi-focused strategy recommended: Maximize exposure to decentralized finance protocols and yield opportunities.';
        } else {
            return 'Moderate strategy recommended: Balanced approach with diversified crypto and DeFi exposure.';
        }
    }

    // Parse natural language intent using AI
    async parseIntent(intentText, currentPortfolio = []) {
        const prompt = `
        Analyze this portfolio rebalancing intent: "${intentText}"
        
        Current portfolio: ${JSON.stringify(currentPortfolio)}
        
        Please provide:
        1. Intent classification (conservative/moderate/aggressive/defi_focused/cross_chain)
        2. Recommended action (increase/decrease/rebalance/diversify)
        3. Target assets and percentages
        4. Risk assessment
        5. Confidence score (0-100)
        
        Respond in JSON format:
        {
            "classification": "strategy_type",
            "action": "recommended_action",
            "targets": [{"asset": "BTC", "percentage": 30}, ...],
            "risk_level": "low/medium/high",
            "confidence": 85,
            "reasoning": "explanation"
        }
        `;

        try {
            const aiResponse = await this.callOpenAI(prompt);
            
            // Try to parse JSON response
            try {
                const parsed = JSON.parse(aiResponse);
                return this.enrichAnalysis(parsed, intentText);
            } catch (parseError) {
                // If JSON parsing fails, create structured response from text
                return this.createStructuredResponse(aiResponse, intentText);
            }
        } catch (error) {
            console.error('Intent parsing failed:', error);
            return this.createFallbackResponse(intentText);
        }
    }

    // Enrich AI analysis with additional data
    enrichAnalysis(aiAnalysis, originalIntent) {
        const strategy = this.strategies[aiAnalysis.classification] || this.strategies.moderate;
        
        return {
            ...aiAnalysis,
            timestamp: Date.now(),
            originalIntent,
            suggestedStrategy: strategy,
            marketContext: this.getCurrentMarketContext(),
            executionSteps: this.generateExecutionSteps(aiAnalysis.targets),
            estimatedGasCost: this.estimateGasCosts(aiAnalysis.targets),
            timeframe: this.recommendTimeframe(aiAnalysis.risk_level)
        };
    }

    // Create structured response from text analysis
    createStructuredResponse(aiText, intentText) {
        const classification = this.extractClassification(aiText);
        const confidence = this.extractConfidence(aiText);
        
        return {
            classification,
            action: 'rebalance',
            targets: this.generateTargets(classification),
            risk_level: this.assessRisk(classification),
            confidence,
            reasoning: aiText,
            timestamp: Date.now(),
            originalIntent: intentText,
            suggestedStrategy: this.strategies[classification],
            marketContext: this.getCurrentMarketContext()
        };
    }

    // Extract classification from AI text response
    extractClassification(text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('conservative')) return 'conservative';
        if (textLower.includes('aggressive')) return 'aggressive';
        if (textLower.includes('defi')) return 'defi_focused';
        if (textLower.includes('cross-chain') || textLower.includes('multi-chain')) return 'cross_chain';
        
        return 'moderate';
    }

    // Extract confidence score from text
    extractConfidence(text) {
        const matches = text.match(/(\d+)%|\bconfidence[:\s]+(\d+)/i);
        if (matches) {
            return parseInt(matches[1] || matches[2]);
        }
        return 75; // Default confidence
    }

    // Generate target allocations based on strategy
    generateTargets(classification) {
        const strategy = this.strategies[classification] || this.strategies.moderate;
        
        return Object.entries(strategy).map(([asset, percentage]) => ({
            asset: asset.toUpperCase(),
            percentage,
            chain: this.getPreferredChain(asset)
        }));
    }

    // Get preferred chain for asset
    getPreferredChain(asset) {
        const chainMap = {
            'BTC': 'ethereum',
            'ETH': 'ethereum',
            'NEAR': 'near',
            'USDC': 'ethereum',
            'USDT': 'ethereum',
            'DeFi': 'ethereum'
        };
        
        return chainMap[asset.toUpperCase()] || 'ethereum';
    }

    // Assess risk level
    assessRisk(classification) {
        const riskMap = {
            conservative: 'low',
            moderate: 'medium',
            aggressive: 'high',
            defi_focused: 'high',
            cross_chain: 'medium'
        };
        
        return riskMap[classification] || 'medium';
    }

    // Get current market context
    getCurrentMarketContext() {
        // Simulate market analysis (in production, this would fetch real data)
        const contexts = [
            { sentiment: 'bullish', trend: 'upward', volatility: 'medium' },
            { sentiment: 'bearish', trend: 'downward', volatility: 'high' },
            { sentiment: 'neutral', trend: 'sideways', volatility: 'low' },
            { sentiment: 'uncertain', trend: 'volatile', volatility: 'very_high' }
        ];
        
        return contexts[Math.floor(Math.random() * contexts.length)];
    }

    // Generate execution steps
    generateExecutionSteps(targets) {
        return targets.map((target, index) => ({
            step: index + 1,
            action: `Allocate ${target.percentage}% to ${target.asset}`,
            chain: target.chain,
            estimatedTime: '2-5 minutes',
            gasEstimate: '$5-15'
        }));
    }

    // Estimate gas costs
    estimateGasCosts(targets) {
        const baseGas = 0.001; // Base gas in ETH
        const perSwapGas = 0.003; // Additional gas per swap
        
        const totalGas = baseGas + (targets.length * perSwapGas);
        
        return {
            eth: totalGas,
            usd: totalGas * 2000, // Assuming ETH price
            breakdown: targets.map(target => ({
                asset: target.asset,
                estimatedGas: perSwapGas,
                estimatedUsd: perSwapGas * 2000
            }))
        };
    }

    // Recommend execution timeframe
    recommendTimeframe(riskLevel) {
        const timeframes = {
            low: 'Execute within 24 hours',
            medium: 'Execute within 4-6 hours',
            high: 'Execute immediately for optimal timing'
        };
        
        return timeframes[riskLevel] || timeframes.medium;
    }

    // Create fallback response for errors
    createFallbackResponse(intentText) {
        const classification = intentText.toLowerCase().includes('conservative') ? 'conservative' : 'moderate';
        
        return {
            classification,
            action: 'rebalance',
            targets: this.generateTargets(classification),
            risk_level: this.assessRisk(classification),
            confidence: 60,
            reasoning: 'Fallback analysis based on keyword detection',
            timestamp: Date.now(),
            originalIntent: intentText,
            suggestedStrategy: this.strategies[classification],
            marketContext: this.getCurrentMarketContext(),
            isFailover: true
        };
    }

    // Analyze portfolio health
    async analyzePortfolioHealth(portfolio) {
        const prompt = `
        Analyze this crypto portfolio for health and optimization opportunities:
        ${JSON.stringify(portfolio)}
        
        Provide analysis on:
        1. Diversification score (0-100)
        2. Risk level assessment
        3. Potential improvements
        4. Rebalancing recommendations
        5. Market timing considerations
        
        Format as JSON with scores and recommendations.
        `;

        try {
            const analysis = await this.callOpenAI(prompt);
            return this.parseHealthAnalysis(analysis, portfolio);
        } catch (error) {
            return this.generateBasicHealthAnalysis(portfolio);
        }
    }

    // Parse health analysis from AI response
    parseHealthAnalysis(aiResponse, portfolio) {
        try {
            const parsed = JSON.parse(aiResponse);
            return {
                ...parsed,
                timestamp: Date.now(),
                portfolioValue: this.calculatePortfolioValue(portfolio),
                riskMetrics: this.calculateRiskMetrics(portfolio)
            };
        } catch (error) {
            return this.generateBasicHealthAnalysis(portfolio);
        }
    }

    // Generate basic health analysis
    generateBasicHealthAnalysis(portfolio) {
        const diversificationScore = this.calculateDiversification(portfolio);
        const riskScore = this.calculateRiskScore(portfolio);
        
        return {
            diversificationScore,
            riskScore,
            healthGrade: this.calculateHealthGrade(diversificationScore, riskScore),
            recommendations: this.generateHealthRecommendations(portfolio),
            timestamp: Date.now(),
            portfolioValue: this.calculatePortfolioValue(portfolio)
        };
    }

    // Calculate portfolio diversification
    calculateDiversification(portfolio) {
        if (!portfolio || portfolio.length === 0) return 0;
        
        const totalValue = portfolio.reduce((sum, asset) => sum + asset.balance, 0);
        const weights = portfolio.map(asset => asset.balance / totalValue);
        
        // Calculate Herfindahl-Hirschman Index for diversification
        const hhi = weights.reduce((sum, weight) => sum + (weight * weight), 0);
        const diversificationScore = Math.max(0, (1 - hhi) * 100);
        
        return Math.round(diversificationScore);
    }

    // Calculate risk score
    calculateRiskScore(portfolio) {
        if (!portfolio || portfolio.length === 0) return 50;
        
        const riskWeights = {
            'BTC': 30,
            'ETH': 35,
            'USDC': 5,
            'USDT': 5,
            'NEAR': 60,
            'DeFi': 70
        };
        
        const totalValue = portfolio.reduce((sum, asset) => sum + asset.balance, 0);
        const weightedRisk = portfolio.reduce((sum, asset) => {
            const weight = asset.balance / totalValue;
            const risk = riskWeights[asset.token_symbol] || 50;
            return sum + (weight * risk);
        }, 0);
        
        return Math.round(weightedRisk);
    }

    // Calculate overall health grade
    calculateHealthGrade(diversification, risk) {
        const balanceScore = 100 - Math.abs(50 - risk); // Closer to moderate risk is better
        const overallScore = (diversification + balanceScore) / 2;
        
        if (overallScore >= 80) return 'A';
        if (overallScore >= 70) return 'B';
        if (overallScore >= 60) return 'C';
        if (overallScore >= 50) return 'D';
        return 'F';
    }

    // Generate health recommendations
    generateHealthRecommendations(portfolio) {
        const recommendations = [];
        const diversification = this.calculateDiversification(portfolio);
        const risk = this.calculateRiskScore(portfolio);
        
        if (diversification < 50) {
            recommendations.push('Increase diversification by adding more asset types');
        }
        
        if (risk > 70) {
            recommendations.push('Consider reducing high-risk positions');
        } else if (risk < 30) {
            recommendations.push('Portfolio may be too conservative - consider growth opportunities');
        }
        
        if (portfolio.length < 3) {
            recommendations.push('Add more assets to improve diversification');
        }
        
        return recommendations;
    }

    // Calculate total portfolio value
    calculatePortfolioValue(portfolio) {
        return portfolio.reduce((sum, asset) => sum + asset.balance, 0);
    }

    // Calculate risk metrics
    calculateRiskMetrics(portfolio) {
        return {
            volatility: this.calculateRiskScore(portfolio),
            diversification: this.calculateDiversification(portfolio),
            concentration: this.calculateConcentration(portfolio)
        };
    }

    // Calculate concentration risk
    calculateConcentration(portfolio) {
        if (!portfolio || portfolio.length === 0) return 100;
        
        const totalValue = this.calculatePortfolioValue(portfolio);
        const maxPosition = Math.max(...portfolio.map(asset => asset.balance));
        
        return Math.round((maxPosition / totalValue) * 100);
    }
}

// Export for Node.js environments (CommonJS)
module.exports = AIPortfolioAnalyzer; 