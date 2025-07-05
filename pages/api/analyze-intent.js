// API route for analyzing natural language portfolio intents
import AIPortfolioAnalyzer from '../../utils/ai-portfolio-analyzer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { intent, portfolio, preferences } = req.body;

        if (!intent || !intent.trim()) {
            return res.status(400).json({ error: 'Intent text is required' });
        }

        // Initialize AI analyzer
        const analyzer = new AIPortfolioAnalyzer();

        // Parse the natural language intent
        const analysis = await analyzer.parseIntent(intent, portfolio || []);

        // Add additional context
        const enhancedAnalysis = {
            ...analysis,
            userPreferences: preferences,
            portfolioSnapshot: portfolio,
            apiVersion: '1.0',
            processingTime: Date.now() - (analysis.timestamp || Date.now())
        };

        // Log the analysis for monitoring (in production, use proper logging)
        console.log('Intent Analysis:', {
            intent: intent.substring(0, 100),
            classification: analysis.classification,
            confidence: analysis.confidence,
            timestamp: new Date().toISOString()
        });

        res.status(200).json(enhancedAnalysis);
    } catch (error) {
        console.error('Intent analysis error:', error);
        
        // Return a fallback response
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            fallback: {
                classification: 'moderate',
                action: 'rebalance',
                confidence: 50,
                reasoning: 'Fallback analysis due to service error',
                risk_level: 'medium',
                targets: [
                    { asset: 'BTC', percentage: 40, chain: 'ethereum' },
                    { asset: 'ETH', percentage: 30, chain: 'ethereum' },
                    { asset: 'USDC', percentage: 20, chain: 'ethereum' },
                    { asset: 'NEAR', percentage: 10, chain: 'near' }
                ]
            }
        });
    }
} 