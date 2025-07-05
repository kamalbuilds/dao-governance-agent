// NEAR Contract Integration for AI Portfolio Rebalancer
import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js';

const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'ai-portfolio.testnet';
const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID || 'testnet';

// NEAR configuration
const nearConfig = {
    networkId: NETWORK_ID,
    keyStore: typeof window !== 'undefined' ? new keyStores.BrowserLocalStorageKeyStore() : new keyStores.InMemoryKeyStore(),
    nodeUrl: NETWORK_ID === 'testnet' ? 'https://rpc.testnet.near.org' : 'https://rpc.mainnet.near.org',
    walletUrl: NETWORK_ID === 'testnet' ? 'https://wallet.testnet.near.org' : 'https://wallet.near.org',
    helperUrl: NETWORK_ID === 'testnet' ? 'https://helper.testnet.near.org' : 'https://helper.near.org',
    explorerUrl: NETWORK_ID === 'testnet' ? 'https://explorer.testnet.near.org' : 'https://explorer.near.org',
};

class PortfolioContract {
    constructor() {
        this.walletConnection = null;
        this.account = null;
        this.contract = null;
        this.near = null;
    }

    // Initialize NEAR connection and wallet
    async init() {
        try {
            // Initialize NEAR connection
            this.near = await connect(nearConfig);
            
            // Initialize wallet connection
            this.walletConnection = new WalletConnection(this.near, 'ai-portfolio-rebalancer');
            
            // Get the current account
            this.account = this.walletConnection.account();
            
            // Initialize contract
            this.contract = new Contract(
                this.account,
                CONTRACT_NAME,
                {
                    viewMethods: [
                        'get_user_portfolio',
                        'get_user_preferences', 
                        'get_intent',
                        'get_trade',
                        'get_latest_market_analysis',
                        'get_portfolio_health',
                        'get_rebalance_suggestions',
                        'get_total_intents',
                        'get_total_trades',
                        'get_total_users',
                        'get_total_volume_usd',
                        'get_user_intents',
                        'get_user_trades',
                        'get_owner'
                    ],
                    changeMethods: [
                        'set_portfolio',
                        'set_user_preferences',
                        'submit_intent',
                        'update_intent_analysis',
                        'create_trade',
                        'update_trade_status',
                        'store_market_analysis'
                    ]
                }
            );

            console.log('NEAR contract initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize NEAR contract:', error);
            return false;
        }
    }

    // Check if user is signed in
    isSignedIn() {
        return this.walletConnection?.isSignedIn() || false;
    }

    // Get current account ID
    getAccountId() {
        return this.walletConnection?.getAccountId() || null;
    }

    // Sign in with NEAR wallet
    signIn() {
        if (this.walletConnection) {
            this.walletConnection.requestSignIn({
                contractId: CONTRACT_NAME,
                methodNames: [
                    'set_portfolio',
                    'set_user_preferences', 
                    'submit_intent',
                    'execute_rebalance'
                ],
                successUrl: window.location.origin,
                failureUrl: window.location.origin
            });
        }
    }

    // Sign out
    signOut() {
        if (this.walletConnection) {
            this.walletConnection.signOut();
            window.location.reload();
        }
    }

    // Get user's portfolio
    async getUserPortfolio(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const portfolio = await this.contract.get_user_portfolio({
                user_id: accountId
            });
            
            console.log('Retrieved portfolio:', portfolio);
            return portfolio || [];
        } catch (error) {
            console.error('Error getting user portfolio:', error);
            return [];
        }
    }

    // Set user's portfolio
    async setUserPortfolio(assets) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to update portfolio');
            }

            const result = await this.contract.set_portfolio(
                { assets },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Portfolio updated:', result);
            return result;
        } catch (error) {
            console.error('Error setting portfolio:', error);
            throw error;
        }
    }

    // Get user preferences
    async getUserPreferences(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const preferences = await this.contract.get_user_preferences({
                user_id: accountId
            });
            
            console.log('Retrieved preferences:', preferences);
            return preferences;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return null;
        }
    }

    // Set user preferences
    async setUserPreferences(preferences) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to update preferences');
            }

            const result = await this.contract.set_user_preferences(
                { preferences },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Preferences updated:', result);
            return result;
        } catch (error) {
            console.error('Error setting preferences:', error);
            throw error;
        }
    }

    // Submit natural language intent
    async submitIntent(intentText) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to submit intent');
            }

            const result = await this.contract.submit_intent(
                {
                    intent_text: intentText
                },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Intent submitted:', result);
            return result;
        } catch (error) {
            console.error('Error submitting intent:', error);
            throw error;
        }
    }

    // Get intent by ID
    async getIntent(intentId) {
        try {
            const intent = await this.contract.get_intent({
                intent_id: intentId
            });
            
            console.log('Retrieved intent:', intent);
            return intent;
        } catch (error) {
            console.error('Error getting intent:', error);
            return null;
        }
    }

    // Get trade by ID
    async getTrade(tradeId) {
        try {
            const trade = await this.contract.get_trade({
                trade_id: tradeId
            });
            
            console.log('Retrieved trade:', trade);
            return trade;
        } catch (error) {
            console.error('Error getting trade:', error);
            return null;
        }
    }

    // Get latest market analysis
    async getLatestMarketAnalysis() {
        try {
            const analysis = await this.contract.get_latest_market_analysis();
            console.log('Retrieved market analysis:', analysis);
            return analysis;
        } catch (error) {
            console.error('Error getting market analysis:', error);
            return null;
        }
    }

    // Get total intents count
    async getTotalIntents() {
        try {
            const count = await this.contract.get_total_intents();
            return count || 0;
        } catch (error) {
            console.error('Error getting total intents:', error);
            return 0;
        }
    }

    // Get total trades count
    async getTotalTrades() {
        try {
            const count = await this.contract.get_total_trades();
            return count || 0;
        } catch (error) {
            console.error('Error getting total trades:', error);
            return 0;
        }
    }

    // Get total users count
    async getTotalUsers() {
        try {
            const count = await this.contract.get_total_users();
            return count || 0;
        } catch (error) {
            console.error('Error getting total users:', error);
            return 0;
        }
    }

    // Get total volume in USD
    async getTotalVolumeUsd() {
        try {
            const volume = await this.contract.get_total_volume_usd();
            return volume || 0;
        } catch (error) {
            console.error('Error getting total volume:', error);
            return 0;
        }
    }

    // Get portfolio health for a user
    async getPortfolioHealth(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const health = await this.contract.get_portfolio_health({
                user_id: accountId
            });
            
            console.log('Retrieved portfolio health:', health);
            return health;
        } catch (error) {
            console.error('Error getting portfolio health:', error);
            return null;
        }
    }

    // Get rebalance suggestions for a user
    async getRebalanceSuggestions(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const suggestions = await this.contract.get_rebalance_suggestions({
                user_id: accountId
            });
            
            console.log('Retrieved rebalance suggestions:', suggestions);
            return suggestions || [];
        } catch (error) {
            console.error('Error getting rebalance suggestions:', error);
            return [];
        }
    }

    // Get all intents for a user
    async getUserIntents(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const intents = await this.contract.get_user_intents({
                user_id: accountId
            });
            
            console.log('Retrieved user intents:', intents);
            return intents || [];
        } catch (error) {
            console.error('Error getting user intents:', error);
            return [];
        }
    }

    // Get all trades for a user
    async getUserTrades(userId = null) {
        try {
            const accountId = userId || this.getAccountId();
            if (!accountId) throw new Error('No account ID available');

            const trades = await this.contract.get_user_trades({
                user_id: accountId
            });
            
            console.log('Retrieved user trades:', trades);
            return trades || [];
        } catch (error) {
            console.error('Error getting user trades:', error);
            return [];
        }
    }

    // Update intent analysis (admin only)
    async updateIntentAnalysis(intentId, targetAllocations, estimatedGasCost, confidenceScore, strategyType) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to update intent analysis');
            }

            const result = await this.contract.update_intent_analysis(
                {
                    intent_id: intentId,
                    target_allocations: targetAllocations,
                    estimated_gas_cost: estimatedGasCost,
                    confidence_score: confidenceScore,
                    strategy_type: strategyType
                },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Intent analysis updated:', result);
            return result;
        } catch (error) {
            console.error('Error updating intent analysis:', error);
            throw error;
        }
    }

    // Create a trade (admin only)
    async createTrade(intentId, fromAsset, toAsset, fromChain, toChain, amount, expectedOutput) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to create trade');
            }

            const result = await this.contract.create_trade(
                {
                    intent_id: intentId,
                    from_asset: fromAsset,
                    to_asset: toAsset,
                    from_chain: fromChain,
                    to_chain: toChain,
                    amount: amount,
                    expected_output: expectedOutput
                },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Trade created:', result);
            return result;
        } catch (error) {
            console.error('Error creating trade:', error);
            throw error;
        }
    }

    // Update trade status (admin only)
    async updateTradeStatus(tradeId, status, txHash = null, actualOutput = null) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to update trade status');
            }

            const result = await this.contract.update_trade_status(
                {
                    trade_id: tradeId,
                    status: status,
                    tx_hash: txHash,
                    actual_output: actualOutput
                },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Trade status updated:', result);
            return result;
        } catch (error) {
            console.error('Error updating trade status:', error);
            throw error;
        }
    }

    // Store market analysis (admin only)
    async storeMarketAnalysis(analysis) {
        try {
            if (!this.isSignedIn()) {
                throw new Error('Please sign in to store market analysis');
            }

            const result = await this.contract.store_market_analysis(
                { analysis },
                '300000000000000', // 300 TGas
                '0' // No deposit required
            );

            console.log('Market analysis stored:', result);
            return result;
        } catch (error) {
            console.error('Error storing market analysis:', error);
            throw error;
        }
    }

    // Get account balance
    async getAccountBalance(accountId = null) {
        try {
            const id = accountId || this.getAccountId();
            if (!id) throw new Error('No account ID available');

            const account = await this.near.account(id);
            const balance = await account.getAccountBalance();
            
            return {
                total: utils.format.formatNearAmount(balance.total),
                available: utils.format.formatNearAmount(balance.available),
                staked: utils.format.formatNearAmount(balance.staked),
                storage: utils.format.formatNearAmount(balance.storage_usage)
            };
        } catch (error) {
            console.error('Error getting account balance:', error);
            return null;
        }
    }

    // Format NEAR amount for display
    formatNearAmount(amount) {
        return utils.format.formatNearAmount(amount, 2);
    }

    // Parse NEAR amount from string
    parseNearAmount(amount) {
        return utils.format.parseNearAmount(amount);
    }

    // Get transaction result
    async getTransactionResult(txHash, accountId = null) {
        try {
            const id = accountId || this.getAccountId();
            if (!id) throw new Error('No account ID available');

            const account = await this.near.account(id);
            const result = await account.getTransactionResult(txHash, id);
            
            console.log('Transaction result:', result);
            return result;
        } catch (error) {
            console.error('Error getting transaction result:', error);
            return null;
        }
    }

    // Get explorer URL for transaction
    getExplorerUrl(txHash) {
        return `${nearConfig.explorerUrl}/transactions/${txHash}`;
    }

    // Get explorer URL for account
    getAccountExplorerUrl(accountId = null) {
        const id = accountId || this.getAccountId();
        return `${nearConfig.explorerUrl}/accounts/${id}`;
    }
}

// Create singleton instance
let contractInstance = null;

export const getContract = async () => {
    if (!contractInstance) {
        contractInstance = new PortfolioContract();
        await contractInstance.init();
    }
    return contractInstance;
};

export default PortfolioContract; 