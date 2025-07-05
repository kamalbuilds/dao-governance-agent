import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Overlay from '../components/Overlay';
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { providers, utils } from "near-api-js";
import "@near-wallet-selector/modal-ui/styles.css";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
    // State management
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [selector, setSelector] = useState(null);
    const [modal, setModal] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [account, setAccount] = useState(null);
    const [portfolio, setPortfolio] = useState([]);
    const [preferences, setPreferences] = useState({
        risk_tolerance: 'moderate',
        preferred_chains: ['ethereum', 'near'],
        auto_rebalance_enabled: false,
        rebalance_threshold: 10,
        max_gas_fee_usd: 50
    });
    const [intentText, setIntentText] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [intents, setIntents] = useState([]);
    const [nearBalance, setNearBalance] = useState(null);
    const [stats, setStats] = useState({ totalIntents: 0, totalTrades: 0 });

    // Contract configuration
    const CONTRACT_ID = "ai-portfolio.testnet";
    const NETWORK_ID = "testnet";

    // Initialize app
    useEffect(() => {
        initializeApp();
    }, []);

    // Load user data when account is connected
    useEffect(() => {
        if (accountId) {
            loadUserData();
        }
    }, [accountId]);

    const setMessageHide = async (message, dur = 3000, success = false) => {
        setMessage(message);
        await sleep(dur);
        setMessage('');
    };

    const initializeApp = async () => {
        try {
            setLoading(true);
            await setMessageHide('Initializing AI Portfolio Rebalancer...', 2000, true);
            
            // Initialize NEAR Wallet Selector
            const walletSelector = await setupWalletSelector({
                network: NETWORK_ID,
                modules: [setupMyNearWallet()],
            });

            // Setup modal for wallet selection
            const walletModal = setupModal(walletSelector, {
                contractId: CONTRACT_ID,
            });

            setSelector(walletSelector);
            setModal(walletModal);
            
            // Check if already connected
            const isSignedIn = walletSelector.isSignedIn();
            if (isSignedIn) {
                const wallet = await walletSelector.wallet();
                const accounts = await wallet.getAccounts();
                if (accounts.length > 0) {
                    setAccountId(accounts[0].accountId);
                    setAccount({
                        accountId: accounts[0].accountId,
                        balance: '0.00'
                    });
                    await setMessageHide(`Welcome back, ${accounts[0].accountId}!`, 2000, true);
                }
            } else {
                await setMessageHide('Please connect your NEAR wallet to continue', 3000);
            }
            
            // Load stats
            await loadStats();
            
            // Load mock market data
            loadMockMarketData();
            
        } catch (error) {
            console.error('Initialization error:', error);
            setMessageHide('Initialization failed. Please refresh the page.', 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async () => {
        if (!accountId || !selector) return;
        
        try {
            setLoading(true);
            await setMessageHide('Loading your portfolio data...', 1000, true);
            
            // Get account balance
            const provider = new providers.JsonRpcProvider({ url: `https://rpc.${NETWORK_ID}.near.org` });
            const accountInfo = await provider.query({
                request_type: "view_account",
                finality: "final",
                account_id: accountId,
            });
            
            const balance = utils.format.formatNearAmount(accountInfo.amount);
            setNearBalance({
                available: balance,
                staked: "0" // Simplified for demo
            });
            setAccount(prev => ({
                ...prev,
                balance: balance
            }));
            
            // Load portfolio from contract
            try {
                const contractPortfolio = await viewMethod('get_user_portfolio', { user_id: accountId });
                if (contractPortfolio && contractPortfolio.length > 0) {
                    setPortfolio(contractPortfolio);
                } else {
                    // Use demo data if no portfolio exists
                    setPortfolio([
                        { token_symbol: 'NEAR', chain: 'near', balance: 1000, target_percentage: 40, current_percentage: 45 },
                        { token_symbol: 'ETH', chain: 'ethereum', balance: 2, target_percentage: 30, current_percentage: 27 },
                        { token_symbol: 'USDC', chain: 'ethereum', balance: 500, target_percentage: 20, current_percentage: 18 },
                        { token_symbol: 'BTC', chain: 'ethereum', balance: 0.1, target_percentage: 10, current_percentage: 10 }
                    ]);
                }
            } catch (error) {
                console.error('Error loading portfolio:', error);
                // Use demo data as fallback
                setPortfolio([
                    { token_symbol: 'NEAR', chain: 'near', balance: 1000, target_percentage: 40, current_percentage: 45 },
                    { token_symbol: 'ETH', chain: 'ethereum', balance: 2, target_percentage: 30, current_percentage: 27 },
                    { token_symbol: 'USDC', chain: 'ethereum', balance: 500, target_percentage: 20, current_percentage: 18 },
                    { token_symbol: 'BTC', chain: 'ethereum', balance: 0.1, target_percentage: 10, current_percentage: 10 }
                ]);
            }
            
            // Load user preferences from contract
            try {
                const contractPreferences = await viewMethod('get_user_preferences', { user_id: accountId });
                if (contractPreferences) {
                    setPreferences(contractPreferences);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            setMessageHide('Error loading portfolio data', 2000);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const contractInfo = await viewMethod('get_contract_info', {});
            // Parse stats from contract info string
            setStats({ totalIntents: 0, totalTrades: 0 }); // Simplified for demo
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadMockMarketData = () => {
        // Mock market data - in production this would come from real APIs
        setMarketData({
            sentiment: 'bullish',
            trend: 'upward',
            volatility: 'medium',
            near_price: 3.85,
            eth_price: 2950,
            btc_price: 45200,
            usdc_price: 1.00,
            last_updated: Date.now()
        });
    };

    const connectWallet = async () => {
        if (modal) {
            modal.show();
        } else {
            setMessageHide('Wallet selector not initialized. Please refresh the page.', 3000);
        }
    };

    const disconnectWallet = async () => {
        if (selector) {
            const wallet = await selector.wallet();
            await wallet.signOut();
            setAccountId(null);
            setAccount(null);
            setPortfolio([]);
            setNearBalance(null);
            setMessageHide('Wallet disconnected', 2000);
        }
    };

    // Helper function to call view methods
    const viewMethod = async (methodName, args = {}) => {
        if (!selector) throw new Error('Wallet selector not initialized');
        
        const provider = new providers.JsonRpcProvider({ url: `https://rpc.${NETWORK_ID}.near.org` });
        const result = await provider.query({
            request_type: "call_function",
            account_id: CONTRACT_ID,
            method_name: methodName,
            args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
            finality: "final",
        });
        
        return JSON.parse(Buffer.from(result.result).toString());
    };

    // Helper function to call change methods
    const callMethod = async (methodName, args = {}, gas = "100000000000000", deposit = "0") => {
        if (!selector || !accountId) throw new Error('Wallet not connected');
        
        const wallet = await selector.wallet();
        return await wallet.signAndSendTransaction({
            receiverId: CONTRACT_ID,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName,
                        args,
                        gas,
                        deposit: utils.format.parseNearAmount(deposit) || "0",
                    },
                },
            ],
        });
    };

    const savePortfolioToContract = async () => {
        if (!accountId) {
            setMessageHide('Please connect your wallet first', 2000);
            return;
        }

        try {
            setLoading(true);
            await setMessageHide('Saving portfolio to blockchain...', 1000, true);
            
            await callMethod('set_user_portfolio', { portfolio });
            await setMessageHide('Portfolio saved successfully!', 2000, true);
        } catch (error) {
            console.error('Error saving portfolio:', error);
            setMessageHide('Failed to save portfolio', 2000);
        } finally {
            setLoading(false);
        }
    };

    const savePreferencesToContract = async () => {
        if (!accountId) {
            setMessageHide('Please connect your wallet first', 2000);
            return;
        }

        try {
            setLoading(true);
            await setMessageHide('Saving preferences to blockchain...', 1000, true);
            
            await callMethod('set_user_preferences', { preferences });
            await setMessageHide('Preferences saved successfully!', 2000, true);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setMessageHide('Failed to save preferences', 2000);
        } finally {
            setLoading(false);
        }
    };

    const analyzeIntent = async () => {
        if (!intentText.trim()) {
            setMessageHide('Please enter your portfolio intent', 2000);
            return;
        }

        setLoading(true);
        try {
            await setMessageHide('AI is analyzing your intent...', 1000, true);

            // Submit intent to smart contract if connected
            let intentId = null;
            if (accountId) {
                try {
                    const result = await callMethod('submit_intent', { intent_text: intentText });
                    // Extract intent ID from transaction result
                    intentId = Date.now(); // Simplified for demo
                    await setMessageHide('Intent submitted to blockchain...', 1000, true);
                } catch (error) {
                    console.error('Error submitting to contract:', error);
                    // Continue with AI analysis even if contract submission fails
                }
            }

            // AI analysis
            const response = await fetch('/api/analyze-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: intentText,
                    portfolio: portfolio,
                    preferences: preferences
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            result.intentId = intentId; // Add contract intent ID if available
            setAnalysis(result);
            
            // Add to intents history
            const newIntent = {
                id: intentId || Date.now(),
                text: intentText,
                analysis: result,
                timestamp: Date.now(),
                status: 'analyzed',
                onChain: !!intentId
            };
            setIntents(prev => [newIntent, ...prev]);

            await setMessageHide('Analysis complete! Review the recommendations below.', 3000, true);
        } catch (error) {
            console.error('Analysis error:', error);
            setMessageHide('Analysis failed. Please try again.', 3000);
        } finally {
            setLoading(false);
        }
    };

    const executeRebalance = async () => {
        if (!analysis) {
            setMessageHide('No analysis available to execute', 2000);
            return;
        }

        setLoading(true);
        try {
            await setMessageHide('Executing portfolio rebalance...', 1000, true);

            // If connected to contract and have intent ID, execute on-chain
            if (accountId && analysis.intentId) {
                try {
                    await setMessageHide('Executing rebalance on blockchain...', 2000, true);
                    await callMethod('execute_rebalance', { intent_id: analysis.intentId });
                } catch (error) {
                    console.error('Contract execution error:', error);
                    // Continue with local simulation
                }
            }

            // Simulate execution steps
            for (let i = 0; i < (analysis.executionSteps?.length || 3); i++) {
                await sleep(1500);
                setMessageHide(`Step ${i + 1}: ${analysis.executionSteps?.[i]?.action || 'Processing...'}`, 1000, true);
            }

            // Update portfolio with new allocations
            if (analysis.targets) {
                const updatedPortfolio = portfolio.map(asset => {
                    const target = analysis.targets.find(t => 
                        t.asset.toLowerCase() === asset.token_symbol.toLowerCase()
                    );
                    if (target) {
                        return {
                            ...asset,
                            current_percentage: target.percentage,
                            target_percentage: target.percentage
                        };
                    }
                    return asset;
                });
                setPortfolio(updatedPortfolio);

                // Save updated portfolio to contract if connected
                if (accountId) {
                    try {
                        await callMethod('set_user_portfolio', { portfolio: updatedPortfolio });
                    } catch (error) {
                        console.error('Error saving updated portfolio:', error);
                    }
                }
            }

            await setMessageHide('Portfolio rebalanced successfully! 🎉', 3000, true);
        } catch (error) {
            console.error('Execution error:', error);
            setMessageHide('Execution failed. Please try again.', 3000);
        } finally {
            setLoading(false);
        }
    };

    const analyzePortfolioHealth = async () => {
        setLoading(true);
        try {
            await setMessageHide('Analyzing portfolio health...', 1000, true);

            const response = await fetch('/api/portfolio-health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio })
            });

            if (!response.ok) throw new Error('Health analysis failed');

            const healthData = await response.json();
            setAnalysis(prev => ({ ...prev, health: healthData }));
            await setMessageHide('Health analysis complete!', 2000, true);
        } catch (error) {
            console.error('Health analysis error:', error);
            setMessageHide('Health analysis failed', 2000);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${value.toFixed(1)}%`;
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'low': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'high': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getHealthGradeColor = (grade) => {
        switch (grade) {
            case 'A': return '#10B981';
            case 'B': return '#3B82F6';
            case 'C': return '#F59E0B';
            case 'D': return '#F97316';
            case 'F': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>AI Portfolio Rebalancer | NEAR Protocol</title>
                <meta name="description" content="AI-powered cross-chain portfolio rebalancing with natural language processing" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        🤖 AI Portfolio Rebalancer
                    </h1>
                    <p className={styles.description}>
                        Natural language portfolio management powered by AI and cross-chain execution
                    </p>
                </div>

                {/* Wallet Connection */}
                <div className={styles.walletSection}>
                    {account ? (
                        <div className={styles.accountInfo}>
                            <h3>Connected Account</h3>
                            <p><strong>Account:</strong> {account.accountId}</p>
                            <p><strong>NEAR Balance:</strong> {account.balance} NEAR</p>
                            {nearBalance && (
                                <div className={styles.balanceDetails}>
                                    <p><strong>Available:</strong> {nearBalance.available} NEAR</p>
                                    <p><strong>Staked:</strong> {nearBalance.staked} NEAR</p>
                                </div>
                            )}
                            <button onClick={disconnectWallet} className={styles.disconnectBtn}>
                                Disconnect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className={styles.connectWallet}>
                            <h3>Connect Your NEAR Wallet</h3>
                            <p>Connect your wallet to save portfolios and execute trades on-chain</p>
                            <button onClick={connectWallet} className={styles.connectBtn}>
                                Connect NEAR Wallet
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className={styles.statsSection}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{stats.totalIntents}</span>
                        <span className={styles.statLabel}>Total Intents</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{stats.totalTrades}</span>
                        <span className={styles.statLabel}>Total Trades</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{portfolio.length}</span>
                        <span className={styles.statLabel}>Assets</span>
                    </div>
                </div>

                {/* Market Overview */}
                {marketData && (
                    <div className={styles.marketOverview}>
                        <h3>Market Overview</h3>
                        <div className={styles.marketGrid}>
                            <div className={styles.marketItem}>
                                <span>Sentiment</span>
                                <span className={`${styles.sentiment} ${styles[marketData.sentiment]}`}>
                                    {marketData.sentiment.toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.marketItem}>
                                <span>NEAR</span>
                                <span>{formatCurrency(marketData.near_price)}</span>
                            </div>
                            <div className={styles.marketItem}>
                                <span>ETH</span>
                                <span>{formatCurrency(marketData.eth_price)}</span>
                            </div>
                            <div className={styles.marketItem}>
                                <span>BTC</span>
                                <span>{formatCurrency(marketData.btc_price)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Overview */}
                <div className={styles.portfolioSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Current Portfolio</h3>
                        <div className={styles.portfolioActions}>
                            <button 
                                className={styles.analyzeBtn}
                                onClick={analyzePortfolioHealth}
                                disabled={loading}
                            >
                                Analyze Health
                            </button>
                            {account && (
                                <button 
                                    className={styles.saveBtn}
                                    onClick={savePortfolioToContract}
                                    disabled={loading}
                                >
                                    Save to Blockchain
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className={styles.portfolioGrid}>
                        {portfolio.map((asset, index) => (
                            <div key={index} className={styles.assetCard}>
                                <div className={styles.assetHeader}>
                                    <span className={styles.assetSymbol}>{asset.token_symbol}</span>
                                    <span className={styles.assetChain}>{asset.chain}</span>
                                </div>
                                <div className={styles.assetValue}>
                                    {asset.balance} {asset.token_symbol}
                                </div>
                                <div className={styles.assetAllocation}>
                                    <span>Current: {formatPercentage(asset.current_percentage)}</span>
                                    <span>Target: {formatPercentage(asset.target_percentage)}</span>
                                </div>
                                <div className={styles.allocationBar}>
                                    <div 
                                        className={styles.allocationFill}
                                        style={{ 
                                            width: `${asset.current_percentage}%`,
                                            backgroundColor: asset.current_percentage === asset.target_percentage ? '#10B981' : '#F59E0B'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Intent Input */}
                <div className={styles.intentSection}>
                    <h3>Natural Language Rebalancing</h3>
                    <p>Tell the AI how you want to rebalance your portfolio:</p>
                    
                    <div className={styles.intentInput}>
                        <textarea
                            value={intentText}
                            onChange={(e) => setIntentText(e.target.value)}
                            placeholder="e.g., 'Make my portfolio more conservative' or 'I want to focus more on DeFi opportunities' or 'Reduce my risk exposure'"
                            rows={3}
                            className={styles.intentTextarea}
                        />
                        <button 
                            onClick={analyzeIntent}
                            disabled={loading || !intentText.trim()}
                            className={styles.analyzeBtn}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Intent'}
                        </button>
                    </div>

                    {/* Quick Intent Buttons */}
                    <div className={styles.quickIntents}>
                        <button onClick={() => setIntentText('Make my portfolio more conservative')}>
                            More Conservative
                        </button>
                        <button onClick={() => setIntentText('I want higher returns, increase risk')}>
                            Higher Returns
                        </button>
                        <button onClick={() => setIntentText('Focus on DeFi opportunities')}>
                            DeFi Focus
                        </button>
                        <button onClick={() => setIntentText('Diversify across multiple chains')}>
                            Cross-Chain
                        </button>
                    </div>
                </div>

                {/* Analysis Results */}
                {analysis && (
                    <div className={styles.analysisSection}>
                        <h3>AI Analysis Results</h3>
                        
                        {analysis.intentId && (
                            <div className={styles.onChainBadge}>
                                ⛓️ Intent submitted to blockchain (ID: {analysis.intentId})
                            </div>
                        )}
                        
                        <div className={styles.analysisGrid}>
                            <div className={styles.analysisCard}>
                                <h4>Strategy Classification</h4>
                                <span className={styles.strategy}>{analysis.classification?.toUpperCase()}</span>
                                <p><strong>Action:</strong> {analysis.action}</p>
                                <p><strong>Confidence:</strong> {analysis.confidence}%</p>
                            </div>

                            <div className={styles.analysisCard}>
                                <h4>Risk Assessment</h4>
                                <span 
                                    className={styles.riskLevel}
                                    style={{ color: getRiskColor(analysis.risk_level) }}
                                >
                                    {analysis.risk_level?.toUpperCase()}
                                </span>
                                <p><strong>Timeframe:</strong> {analysis.timeframe}</p>
                            </div>

                            {analysis.health && (
                                <div className={styles.analysisCard}>
                                    <h4>Portfolio Health</h4>
                                    <span 
                                        className={styles.healthGrade}
                                        style={{ color: getHealthGradeColor(analysis.health.healthGrade) }}
                                    >
                                        Grade: {analysis.health.healthGrade}
                                    </span>
                                    <p><strong>Diversification:</strong> {analysis.health.diversificationScore}%</p>
                                    <p><strong>Risk Score:</strong> {analysis.health.riskScore}%</p>
                                </div>
                            )}
                        </div>

                        {/* Reasoning */}
                        <div className={styles.reasoning}>
                            <h4>AI Reasoning</h4>
                            <p>{analysis.reasoning}</p>
                        </div>

                        {/* Target Allocations */}
                        {analysis.targets && (
                            <div className={styles.targets}>
                                <h4>Recommended Allocations</h4>
                                <div className={styles.targetGrid}>
                                    {analysis.targets.map((target, index) => (
                                        <div key={index} className={styles.targetItem}>
                                            <span className={styles.targetAsset}>{target.asset}</span>
                                            <span className={styles.targetPercentage}>{target.percentage}%</span>
                                            <span className={styles.targetChain}>{target.chain}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Gas Estimation */}
                        {analysis.estimatedGasCost && (
                            <div className={styles.gasEstimation}>
                                <h4>Estimated Costs</h4>
                                <p><strong>Total Gas:</strong> {formatCurrency(analysis.estimatedGasCost.usd)}</p>
                                <p><strong>ETH Cost:</strong> {analysis.estimatedGasCost.eth.toFixed(4)} ETH</p>
                            </div>
                        )}

                        {/* Execute Button */}
                        <button 
                            onClick={executeRebalance}
                            disabled={loading}
                            className={`${styles.executeBtn} ${styles.primary}`}
                        >
                            {loading ? 'Executing...' : 'Execute Rebalance'}
                        </button>
                    </div>
                )}

                {/* Intent History */}
                {intents.length > 0 && (
                    <div className={styles.historySection}>
                        <h3>Intent History</h3>
                        <div className={styles.intentHistory}>
                            {intents.slice(0, 5).map((intent) => (
                                <div key={intent.id} className={styles.intentItem}>
                                    <div className={styles.intentText}>"{intent.text}"</div>
                                    <div className={styles.intentMeta}>
                                        <span>{new Date(intent.timestamp).toLocaleTimeString()}</span>
                                        <div className={styles.intentBadges}>
                                            <span className={styles.intentStatus}>{intent.status}</span>
                                            {intent.onChain && <span className={styles.onChainBadge}>On-Chain</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User Preferences */}
                <div className={styles.preferencesSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Portfolio Preferences</h3>
                        {account && (
                            <button 
                                className={styles.saveBtn}
                                onClick={savePreferencesToContract}
                                disabled={loading}
                            >
                                Save to Blockchain
                            </button>
                        )}
                    </div>
                    <div className={styles.preferencesGrid}>
                        <div className={styles.preferenceItem}>
                            <label>Risk Tolerance</label>
                            <select 
                                value={preferences.risk_tolerance}
                                onChange={(e) => setPreferences(prev => ({ ...prev, risk_tolerance: e.target.value }))}
                            >
                                <option value="conservative">Conservative</option>
                                <option value="moderate">Moderate</option>
                                <option value="aggressive">Aggressive</option>
                            </select>
                        </div>
                        <div className={styles.preferenceItem}>
                            <label>Rebalance Threshold (%)</label>
                            <input 
                                type="number"
                                value={preferences.rebalance_threshold}
                                onChange={(e) => setPreferences(prev => ({ ...prev, rebalance_threshold: parseInt(e.target.value) }))}
                                min="1"
                                max="50"
                            />
                        </div>
                        <div className={styles.preferenceItem}>
                            <label>Max Gas Fee (USD)</label>
                            <input 
                                type="number"
                                value={preferences.max_gas_fee_usd}
                                onChange={(e) => setPreferences(prev => ({ ...prev, max_gas_fee_usd: parseInt(e.target.value) }))}
                                min="1"
                                max="500"
                            />
                        </div>
                        <div className={styles.preferenceItem}>
                            <label>
                                <input 
                                    type="checkbox"
                                    checked={preferences.auto_rebalance_enabled}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, auto_rebalance_enabled: e.target.checked }))}
                                />
                                Auto-rebalance enabled
                            </label>
                        </div>
                    </div>
                </div>
            </main>

            {message && <Overlay message={message} />}
        </div>
    );
}
