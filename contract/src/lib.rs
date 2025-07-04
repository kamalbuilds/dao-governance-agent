use hex::{decode, encode};
use near_sdk::{
    env::{self, block_timestamp},
    near, require,
    store::{IterableMap, IterableSet, Vector},
    AccountId, Gas, NearToken, PanicOnDefault, Promise,
    serde::{Deserialize, Serialize},
};

use dcap_qvl::{verify, QuoteCollateralV3};

mod collateral;
mod ecdsa;
mod external;
mod utils;

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Worker {
    checksum: String,
    codehash: String,
}

// Portfolio and Rebalancing Structures
#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct PortfolioAsset {
    pub symbol: String,
    pub chain: String, // "near" or "ethereum"
    pub contract_address: Option<String>,
    pub target_percentage: u32, // 0-100
    pub current_percentage: u32,
    pub current_value_usd: u128,
    pub last_updated: u64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct RebalanceIntent {
    pub id: u64,
    pub user_id: AccountId,
    pub intent_text: String, // Natural language intent
    pub parsed_action: String, // AI-parsed action
    pub target_allocations: Vec<PortfolioAsset>,
    pub max_slippage: u32, // basis points
    pub min_trade_size_usd: u128,
    pub status: String, // "pending", "executing", "completed", "failed"
    pub created_at: u64,
    pub executed_at: Option<u64>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct UserPreferences {
    pub user_id: AccountId,
    pub risk_tolerance: String, // "conservative", "moderate", "aggressive"
    pub preferred_chains: Vec<String>,
    pub auto_rebalance_enabled: bool,
    pub rebalance_threshold: u32, // percentage deviation to trigger rebalance
    pub max_gas_fee_usd: u128,
    pub learning_data: Vector<String>, // Store user interaction patterns
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct MarketAnalysis {
    pub timestamp: u64,
    pub market_sentiment: String, // "bullish", "bearish", "neutral"
    pub volatility_score: u32, // 0-100
    pub recommended_action: String,
    pub confidence_score: u32, // 0-100
    pub analysis_data: String, // JSON string with detailed analysis
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct TradeExecution {
    pub id: u64,
    pub intent_id: u64,
    pub from_asset: String,
    pub to_asset: String,
    pub from_chain: String,
    pub to_chain: String,
    pub amount: u128,
    pub expected_output: u128,
    pub actual_output: Option<u128>,
    pub tx_hash: Option<String>,
    pub status: String, // "pending", "signed", "broadcasted", "confirmed", "failed"
    pub created_at: u64,
    pub executed_at: Option<u64>,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub approved_codehashes: IterableSet<String>,
    pub worker_by_account_id: IterableMap<AccountId, Worker>,
    
    // Portfolio Management
    pub user_portfolios: IterableMap<AccountId, Vector<PortfolioAsset>>,
    pub user_preferences: IterableMap<AccountId, UserPreferences>,
    pub rebalance_intents: IterableMap<u64, RebalanceIntent>,
    pub trade_executions: IterableMap<u64, TradeExecution>,
    pub market_analysis: Vector<MarketAnalysis>,
    
    // Counters
    pub next_intent_id: u64,
    pub next_trade_id: u64,
    
    // AI Learning Parameters
    pub global_learning_data: Vector<String>,
    pub successful_strategies: IterableMap<String, u32>, // strategy -> success_count
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn init(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            approved_codehashes: IterableSet::new(b"a"),
            worker_by_account_id: IterableMap::new(b"b"),
            user_portfolios: IterableMap::new(b"c"),
            user_preferences: IterableMap::new(b"d"),
            rebalance_intents: IterableMap::new(b"e"),
            trade_executions: IterableMap::new(b"f"),
            market_analysis: Vector::new(b"g"),
            next_intent_id: 1,
            next_trade_id: 1,
            global_learning_data: Vector::new(b"h"),
            successful_strategies: IterableMap::new(b"i"),
        }
    }

    // Approve a new codehash
    pub fn approve_codehash(&mut self, codehash: String) {
        self.require_owner();
        self.approved_codehashes.insert(codehash);
    }

    /// Will throw an error if the worker agent is not registered with a codehash in self.approved_codehashes
    pub fn sign_tx(
        &mut self,
        payload: Vec<u8>,
        derivation_path: String,
        key_version: u32,
    ) -> Promise {
        // Comment out this line for local development
        self.require_registered_worker();

        // Call the MPC contract to get a signature for the payload
        ecdsa::get_sig(payload, derivation_path, key_version)
    }

    // Register worker
    pub fn register_worker(
        &mut self,
        quote_hex: String,
        collateral: String,
        checksum: String,
        tcb_info: String,
    ) -> bool {
        let collateral = collateral::get_collateral(collateral);
        let quote = decode(quote_hex).unwrap();
        let now = block_timestamp() / 1000000000;
        let result = verify::verify(&quote, &collateral, now).expect("report is not verified");
        let report = result.report.as_td10().unwrap();
        let report_data = format!("{}", String::from_utf8_lossy(&report.report_data));

        // verify the predecessor matches the report data
        require!(
            env::predecessor_account_id() == report_data,
            format!("predecessor_account_id != report_data: {}", report_data)
        );

        let rtmr3 = encode(report.rt_mr3.to_vec());
        let shade_agent_app_image = collateral::verify_codehash(tcb_info, rtmr3);

        // verify the code hashes are approved
        require!(self.approved_codehashes.contains(&shade_agent_app_image));

        let predecessor = env::predecessor_account_id();
        self.worker_by_account_id.insert(
            predecessor,
            Worker {
                checksum,
                codehash: shade_agent_app_image,
            },
        );

        true
    }

    // Portfolio Management Methods

    /// Create or update user portfolio
    pub fn set_portfolio(&mut self, assets: Vec<PortfolioAsset>) {
        let user_id = env::predecessor_account_id();
        let mut portfolio = Vector::new(format!("portfolio_{}", user_id).as_bytes());
        
        for asset in assets {
            portfolio.push(asset);
        }
        
        self.user_portfolios.insert(user_id, portfolio);
    }

    /// Set user preferences for AI learning
    pub fn set_user_preferences(&mut self, preferences: UserPreferences) {
        let user_id = env::predecessor_account_id();
        require!(preferences.user_id == user_id, "User ID mismatch");
        self.user_preferences.insert(user_id, preferences);
    }

    /// Submit a natural language rebalancing intent
    pub fn submit_intent(&mut self, intent_text: String, max_slippage: u32, min_trade_size_usd: u128) -> u64 {
        let user_id = env::predecessor_account_id();
        let intent_id = self.next_intent_id;
        self.next_intent_id += 1;

        let intent = RebalanceIntent {
            id: intent_id,
            user_id: user_id.clone(),
            intent_text,
            parsed_action: "pending_analysis".to_string(),
            target_allocations: Vec::new(),
            max_slippage,
            min_trade_size_usd,
            status: "pending".to_string(),
            created_at: block_timestamp(),
            executed_at: None,
        };

        self.rebalance_intents.insert(intent_id, intent);
        
        // Store learning data
        if let Some(mut prefs) = self.user_preferences.get(&user_id) {
            prefs.learning_data.push(format!("intent:{}", intent.intent_text));
            self.user_preferences.insert(user_id, prefs);
        }

        intent_id
    }

    /// Update intent with AI analysis results
    pub fn update_intent_analysis(&mut self, intent_id: u64, parsed_action: String, target_allocations: Vec<PortfolioAsset>) {
        self.require_registered_worker();
        
        if let Some(mut intent) = self.rebalance_intents.get(&intent_id) {
            intent.parsed_action = parsed_action;
            intent.target_allocations = target_allocations;
            intent.status = "analyzed".to_string();
            self.rebalance_intents.insert(intent_id, intent);
        }
    }

    /// Execute rebalance trades
    pub fn execute_rebalance(&mut self, intent_id: u64) -> Vec<u64> {
        self.require_registered_worker();
        
        let mut trade_ids = Vec::new();
        
        if let Some(mut intent) = self.rebalance_intents.get(&intent_id) {
            intent.status = "executing".to_string();
            intent.executed_at = Some(block_timestamp());
            
            // Create trade executions for each required swap
            for allocation in &intent.target_allocations {
                let trade_id = self.next_trade_id;
                self.next_trade_id += 1;
                
                let trade = TradeExecution {
                    id: trade_id,
                    intent_id,
                    from_asset: "USDC".to_string(), // Simplified for demo
                    to_asset: allocation.symbol.clone(),
                    from_chain: "ethereum".to_string(),
                    to_chain: allocation.chain.clone(),
                    amount: allocation.current_value_usd,
                    expected_output: allocation.current_value_usd, // Simplified
                    actual_output: None,
                    tx_hash: None,
                    status: "pending".to_string(),
                    created_at: block_timestamp(),
                    executed_at: None,
                };
                
                self.trade_executions.insert(trade_id, trade);
                trade_ids.push(trade_id);
            }
            
            self.rebalance_intents.insert(intent_id, intent);
        }
        
        trade_ids
    }

    /// Update trade execution status
    pub fn update_trade_status(&mut self, trade_id: u64, status: String, tx_hash: Option<String>, actual_output: Option<u128>) {
        self.require_registered_worker();
        
        if let Some(mut trade) = self.trade_executions.get(&trade_id) {
            trade.status = status.clone();
            trade.tx_hash = tx_hash;
            trade.actual_output = actual_output;
            
            if status == "confirmed" {
                trade.executed_at = Some(block_timestamp());
                
                // Update successful strategies counter
                let strategy_key = format!("{}_{}", trade.from_chain, trade.to_chain);
                let current_count = self.successful_strategies.get(&strategy_key).unwrap_or(0);
                self.successful_strategies.insert(strategy_key, current_count + 1);
            }
            
            self.trade_executions.insert(trade_id, trade);
        }
    }

    /// Store market analysis from AI
    pub fn store_market_analysis(&mut self, analysis: MarketAnalysis) {
        self.require_registered_worker();
        self.market_analysis.push(analysis);
        
        // Keep only last 100 analyses
        while self.market_analysis.len() > 100 {
            self.market_analysis.swap_remove(0);
        }
    }

    /// Get auto-rebalance suggestions based on user preferences and market analysis
    pub fn get_rebalance_suggestions(&self, user_id: AccountId) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        if let Some(portfolio) = self.user_portfolios.get(&user_id) {
            if let Some(preferences) = self.user_preferences.get(&user_id) {
                if preferences.auto_rebalance_enabled {
                    // Check if any asset is beyond threshold
                    for i in 0..portfolio.len() {
                        if let Some(asset) = portfolio.get(i) {
                            let deviation = if asset.current_percentage > asset.target_percentage {
                                asset.current_percentage - asset.target_percentage
                            } else {
                                asset.target_percentage - asset.current_percentage
                            };
                            
                            if deviation > preferences.rebalance_threshold {
                                suggestions.push(format!(
                                    "Rebalance {} from {}% to {}% (deviation: {}%)",
                                    asset.symbol,
                                    asset.current_percentage,
                                    asset.target_percentage,
                                    deviation
                                ));
                            }
                        }
                    }
                }
            }
        }
        
        suggestions
    }

    // View functions
    pub fn get_worker(&self, account_id: AccountId) -> Worker {
        self.worker_by_account_id
            .get(&account_id)
            .unwrap()
            .to_owned()
    }

    pub fn get_user_portfolio(&self, user_id: AccountId) -> Vec<PortfolioAsset> {
        if let Some(portfolio) = self.user_portfolios.get(&user_id) {
            let mut assets = Vec::new();
            for i in 0..portfolio.len() {
                if let Some(asset) = portfolio.get(i) {
                    assets.push(asset);
                }
            }
            assets
        } else {
            Vec::new()
        }
    }

    pub fn get_user_preferences(&self, user_id: AccountId) -> Option<UserPreferences> {
        self.user_preferences.get(&user_id)
    }

    pub fn get_intent(&self, intent_id: u64) -> Option<RebalanceIntent> {
        self.rebalance_intents.get(&intent_id)
    }

    pub fn get_trade(&self, trade_id: u64) -> Option<TradeExecution> {
        self.trade_executions.get(&trade_id)
    }

    pub fn get_latest_market_analysis(&self) -> Option<MarketAnalysis> {
        if self.market_analysis.len() > 0 {
            self.market_analysis.get(self.market_analysis.len() - 1)
        } else {
            None
        }
    }

    pub fn get_successful_strategies(&self) -> Vec<(String, u32)> {
        let mut strategies = Vec::new();
        for (strategy, count) in self.successful_strategies.iter() {
            strategies.push((strategy, count));
        }
        strategies
    }

    // Helpers for method access control
    fn require_owner(&self) {
        require!(env::predecessor_account_id() == self.owner_id);
    }

    fn require_registered_worker(&self) {
        let worker = self.get_worker(env::predecessor_account_id());
        require!(self.approved_codehashes.contains(&worker.codehash));
    }
}
