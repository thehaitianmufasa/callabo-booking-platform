export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const;

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceId: '', // No Stripe price ID for free plan
    features: [
      'Up to 2 users',
      'Up to 3 projects',
      'Up to 5 workflows',
      'Basic analytics',
      'Community support',
    ],
    limits: {
      maxUsers: 2,
      maxProjects: 3,
      maxWorkflows: 5,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For growing teams and businesses',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
    features: [
      'Up to 10 users',
      'Up to 25 projects',
      'Unlimited workflows',
      'Advanced analytics',
      'Real-time monitoring',
      'Priority support',
      'API access',
    ],
    limits: {
      maxUsers: 10,
      maxProjects: 25,
      maxWorkflows: -1, // Unlimited
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large teams with advanced needs',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || '',
    features: [
      'Unlimited users',
      'Unlimited projects',
      'Unlimited workflows',
      'Custom integrations',
      'Advanced security',
      'Dedicated support',
      'Custom SLA',
      'On-premise deployment',
    ],
    limits: {
      maxUsers: -1, // Unlimited
      maxProjects: -1, // Unlimited
      maxWorkflows: -1, // Unlimited
    },
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;