// API route for portfolio health analysis
import AIPortfolioAnalyzer from '../../utils/ai-portfolio-analyzer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { portfolio } = req.body;

        if (!portfolio || !Array.isArray(portfolio)) {
            return res.status(400).json({ error: 'Portfolio array is required' });
        }

        // Initialize AI analyzer
        const analyzer = new AIPortfolioAnalyzer();

        // Analyze portfolio health
        const healthAnalysis = await analyzer.analyzePortfolioHealth(portfolio);

        // Add additional metrics
        const enhancedHealth = {
            ...healthAnalysis,
            totalValue: analyzer.calculatePortfolioValue(portfolio),
            assetCount: portfolio.length,
            largestPosition: Math.max(...portfolio.map(asset => asset.balance)),
            smallestPosition: Math.min(...portfolio.map(asset => asset.balance)),
            analysisTimestamp: Date.now()
        };

        // Log the health analysis
        console.log('Portfolio Health Analysis:', {
            totalValue: enhancedHealth.totalValue,
            healthGrade: enhancedHealth.healthGrade,
            diversificationScore: enhancedHealth.diversificationScore,
            riskScore: enhancedHealth.riskScore,
            timestamp: new Date().toISOString()
        });

        res.status(200).json(enhancedHealth);
    } catch (error) {
        console.error('Portfolio health analysis error:', error);
        
        // Return a fallback response
        res.status(500).json({
            error: 'Health analysis failed',
            message: error.message,
            fallback: {
                healthGrade: 'C',
                diversificationScore: 60,
                riskScore: 50,
                recommendations: [
                    'Unable to perform detailed analysis',
                    'Consider manual portfolio review',
                    'Ensure portfolio diversification'
                ],
                totalValue: 0,
                analysisTimestamp: Date.now()
            }
        });
    }
} 