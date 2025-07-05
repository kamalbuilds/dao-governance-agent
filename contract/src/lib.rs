use near_sdk::{
    env, near, require,
    store::{IterableMap, Vector},
    AccountId, PanicOnDefault,
};
use serde::{Deserialize, Serialize};
use borsh::{BorshDeserialize, BorshSerialize};
use schemars::JsonSchema;

// Core data structures
#[derive(Clone, Serialize, Deserialize, BorshSerialize, BorshDeserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct PortfolioAsset {
    pub token_symbol: String,
    pub chain: String,
    pub balance: u128,
    pub target_percentage: u32,
    pub current_percentage: u32,
}

#[derive(Clone, Serialize, Deserialize, BorshSerialize, BorshDeserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct UserPreferences {
    pub risk_tolerance: String, // "conservative", "moderate", "aggressive"
    pub preferred_chains: Vec<String>,
    pub auto_rebalance_enabled: bool,
    pub rebalance_threshold: u32,
    pub max_gas_fee_usd: u128,
}

#[derive(Clone, Serialize, Deserialize, BorshSerialize, BorshDeserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct RebalanceIntent {
    pub user_id: String,
    pub intent_text: String,
    pub status: String,
    pub created_at: u64,
    pub target_allocations: Vec<PortfolioAsset>,
}

#[derive(Clone, Serialize, Deserialize, BorshSerialize, BorshDeserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct MarketAnalysis {
    pub timestamp: u64,
    pub market_sentiment: String,
    pub recommended_strategy: String,
    pub confidence_score: u32,
}

// Main contract
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct PortfolioRebalancer {
    pub owner_id: AccountId,
    pub user_portfolios: IterableMap<AccountId, Vector<PortfolioAsset>>,
    pub user_preferences: IterableMap<AccountId, UserPreferences>,
    pub rebalance_intents: IterableMap<u64, RebalanceIntent>,
    pub market_analysis: Vector<MarketAnalysis>,
    pub next_intent_id: u64,
}

#[near]
impl PortfolioRebalancer {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            user_portfolios: IterableMap::new(b"p"),
            user_preferences: IterableMap::new(b"u"),
            rebalance_intents: IterableMap::new(b"r"),
            market_analysis: Vector::new(b"m"),
            next_intent_id: 1,
        }
    }

    // User portfolio management
    pub fn set_portfolio(&mut self, assets: Vec<PortfolioAsset>) {
        let user_id = env::predecessor_account_id();
        let mut portfolio = Vector::new(format!("portfolio_{}", user_id).as_bytes());
        
        for asset in assets {
            portfolio.push(asset);
        }
        
        self.user_portfolios.insert(user_id, portfolio);
    }

    pub fn get_user_portfolio(&self, user_id: AccountId) -> Vec<PortfolioAsset> {
        if let Some(portfolio) = self.user_portfolios.get(&user_id) {
            let mut assets = Vec::new();
            for i in 0..portfolio.len() {
                if let Some(asset) = portfolio.get(i) {
                    assets.push(asset.clone());
                }
            }
            assets
        } else {
            Vec::new()
        }
    }

    // User preferences
    pub fn set_user_preferences(&mut self, preferences: UserPreferences) {
        let user_id = env::predecessor_account_id();
        self.user_preferences.insert(user_id, preferences);
    }

    pub fn get_user_preferences(&self, user_id: AccountId) -> Option<UserPreferences> {
        self.user_preferences.get(&user_id).cloned()
    }

    // Intent submission
    pub fn submit_intent(&mut self, intent_text: String) -> u64 {
        let user_id = env::predecessor_account_id();
        let intent_id = self.next_intent_id;
        self.next_intent_id += 1;

        let intent = RebalanceIntent {
            user_id: user_id.to_string(),
            intent_text,
            status: "pending".to_string(),
            created_at: env::block_timestamp(),
            target_allocations: Vec::new(),
        };

        self.rebalance_intents.insert(intent_id, intent);
        intent_id
    }

    pub fn get_intent(&self, intent_id: u64) -> Option<RebalanceIntent> {
        self.rebalance_intents.get(&intent_id).cloned()
    }

    // Market analysis
    pub fn store_market_analysis(&mut self, analysis: MarketAnalysis) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can store market analysis"
        );
        self.market_analysis.push(analysis);
    }

    pub fn get_latest_market_analysis(&self) -> Option<MarketAnalysis> {
        if self.market_analysis.len() > 0 {
            self.market_analysis.get(self.market_analysis.len() - 1).cloned()
        } else {
            None
        }
    }

    // AI suggestions
    pub fn get_rebalance_suggestions(&self, user_id: AccountId) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        if let Some(portfolio) = self.user_portfolios.get(&user_id) {
            // Simple AI logic for suggestions
            for i in 0..portfolio.len() {
                if let Some(asset) = portfolio.get(i) {
                    if asset.current_percentage > asset.target_percentage + 5 {
                        suggestions.push(format!("Consider reducing {} allocation", asset.token_symbol));
                    } else if asset.current_percentage < asset.target_percentage - 5 {
                        suggestions.push(format!("Consider increasing {} allocation", asset.token_symbol));
                    }
                }
            }
        }
        
        if suggestions.is_empty() {
            suggestions.push("Portfolio is well balanced".to_string());
        }
        
        suggestions
    }

    // View methods
    pub fn get_owner(&self) -> AccountId {
        self.owner_id.clone()
    }

    pub fn get_total_intents(&self) -> u64 {
        self.next_intent_id - 1
    }

    pub fn get_total_users(&self) -> u64 {
        self.user_portfolios.len() as u64
    }
}
