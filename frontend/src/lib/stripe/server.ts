import Stripe from 'stripe';
import { STRIPE_CONFIG } from './config';

// Initialize Stripe on the server side
export const stripe = STRIPE_CONFIG.secretKey 
  ? new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null;

// Helper function to create a customer
export async function createStripeCustomer(params: {
  email: string;
  name?: string;
  tenantId: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      tenantId: params.tenantId,
    },
  });

  return customer;
}

// Helper function to create a subscription
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  tenantId: string;
  trialDays?: number;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays,
    metadata: {
      tenantId: params.tenantId,
    },
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
}

// Helper function to update a subscription
export async function updateSubscription(params: {
  subscriptionId: string;
  priceId: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.priceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });

  return updatedSubscription;
}

// Helper function to cancel a subscription
export async function cancelSubscription(params: {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  if (params.cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(params.subscriptionId);
  }
}

// Helper function to create a customer portal session
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

// Helper function to create a checkout session
export async function createCheckoutSession(params: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  tenantId: string;
  trialDays?: number;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      tenantId: params.tenantId,
    },
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else {
    sessionParams.customer_creation = 'always';
  }

  if (params.trialDays) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
      metadata: {
        tenantId: params.tenantId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.webhookSecret
  );
}