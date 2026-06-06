import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const config = (req, res) =>
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur'
    });

    if (!paymentIntent) {
      res.statusCode = 500;
      throw new Error('No payment intent');
    }
    res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

export { config, createPaymentIntent };
