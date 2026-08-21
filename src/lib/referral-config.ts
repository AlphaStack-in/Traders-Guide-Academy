/**
 * Centralized Referral & Reward Configuration
 * Configurable business rules for subscription credit rewards and social promotion.
 */
export const REFERRAL_CONFIG = {
  // Reward for each successful paid referral (in ₹)
  SUCCESSFUL_REFERRAL_REWARD: 1000,

  // Daily social promotion reward (in ₹)
  SOCIAL_PROMOTION_DAILY_REWARD: 10,

  // Anti-abuse limits
  MAX_DAILY_SOCIAL_REWARD: 10,
  MAX_MONTHLY_SOCIAL_REWARD: 300,

  // Referral milestones thresholds (successful referrals count)
  MILESTONE_THRESHOLDS: [1, 3, 5, 10],

  // Enable/disable top referrers leaderboard
  LEADERBOARD_ENABLED: true,

  // Reward description formats
  CURRENCY_SYMBOL: "₹",
  CREDIT_LABEL: "Subscription Credit",
};
