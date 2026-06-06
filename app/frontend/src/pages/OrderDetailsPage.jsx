import React, { useState } from 'react';

import { useParams, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Button, Image, Card, Form } from 'react-bootstrap';
import {
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useUpdateDeliverMutation,
  useGetStripePublishableKeyQuery
} from '../slices/ordersApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ServerError from '../components/ServerError';

import axios from 'axios';
import Meta from '../components/Meta';
import { addCurrency } from '../utils/addCurrency';

const StripePayForm = ({ orderId, order, payOrder, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      elements.getElement(CardElement)
    );

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      const details = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        updateTime: new Date().toLocaleTimeString(),
        email: order?.user?.email
      };
      await payOrder({ orderId, details });
      toast.success('Payment successful');
      onSuccess();
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' }
            },
            invalid: { color: '#9e2146' }
          }
        }}
      />
      <Button
        className='w-100 mt-3'
        variant='warning'
        type='submit'
        disabled={!stripe || processing}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
    </Form>
  );
};

const OrderDetailsPage = () => {
  const { id: orderId } = useParams();
  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);
  const [clientSecret, setClientSecret] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const [payOrder] = usePayOrderMutation();
  const [updateDeliver, { isLoading: isUpdateDeliverLoading }] =
    useUpdateDeliverMutation();

  const { userInfo } = useSelector(state => state.auth);

  const { data: stripeKey } = useGetStripePublishableKeyQuery();
  const stripePromise = stripeKey
    ? loadStripe(stripeKey.publishableKey)
    : null;

  const paymentHandler = async () => {
    try {
      setCreatingIntent(true);
      const { data } = await axios.post(
        '/api/v1/payment/stripe/create-payment-intent',
        { amount: order.totalPrice }
      );
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    } finally {
      setCreatingIntent(false);
    }
  };

  const deliveredHandler = async () => {
    try {
      await updateDeliver(orderId);
      toast.success('Order Delivered');
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Meta title={'Order Details'} />
          <h1>Order ID: {orderId}</h1>
          <Row>
            <Col md={8}>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h2>Shipping </h2>
                  <div className='mb-3'>
                    <strong>Name:</strong> {order?.user?.name}
                  </div>
                  <div className='mb-3'>
                    <strong>Email:</strong> {order?.user?.email}
                  </div>
                  <div className='mb-3'>
                    <strong>Address:</strong> {order?.shippingAddress?.address},
                    {order?.shippingAddress?.city},
                    {order?.shippingAddress?.postalCode},
                    {order?.shippingAddress?.country} <br />
                  </div>
                  {order?.isDelivered ? (
                    <Message variant='success'>
                      Delivered on{' '}
                      {new Date(order?.deliveredAt).toLocaleString()}
                    </Message>
                  ) : (
                    <Message variant={'danger'}>{'Not Delivered'}</Message>
                  )}
                </ListGroup.Item>
                <ListGroup.Item>
                  <h2>Payment Method </h2>
                  <div className='mb-3'>
                    <strong>Method:</strong> {order?.paymentMethod}
                  </div>
                  {order?.isPaid ? (
                    <Message variant={'success'}>
                      Paid on {new Date(order?.paidAt).toLocaleString()}
                    </Message>
                  ) : (
                    <Message variant={'danger'}>{'Not paid'}</Message>
                  )}
                </ListGroup.Item>
                <ListGroup.Item>
                  <h2>Order Items </h2>
                  <ListGroup variant='flush'>
                    {order?.orderItems?.map(item => (
                      <ListGroup.Item key={item._id}>
                        <Row>
                          <Col md={2}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fluid
                              rounded
                            />
                          </Col>
                          <Col md={6}>
                            <Link
                              to={`/product/${item._id}`}
                              className='product-title text-dark'
                              style={{ textDecoration: 'none' }}
                            >
                              {item.name}
                            </Link>
                          </Col>
                          <Col md={4}>
                            {item.qty} x {addCurrency(item.price)} =
                            {addCurrency(item.qty * item.price)}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={4}>
              <Card>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <h2>Order Summary</h2>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Items:</Col>
                      <Col>{addCurrency(order?.itemsPrice)}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Shipping:</Col>
                      <Col>{addCurrency(order?.shippingPrice)}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Tax:</Col>
                      <Col>{addCurrency(order?.taxPrice)}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Total:</Col>
                      <Col>{addCurrency(order?.totalPrice)}</Col>
                    </Row>
                  </ListGroup.Item>
                  {!order?.isPaid && !userInfo.isAdmin && !clientSecret && (
                    <ListGroup.Item>
                      <Button
                        className='w-100'
                        variant='warning'
                        onClick={paymentHandler}
                        disabled={creatingIntent}
                        style={{ marginBottom: '10px' }}
                      >
                        {creatingIntent ? 'Loading...' : 'Pay Order'}
                      </Button>
                    </ListGroup.Item>
                  )}
                  {!order?.isPaid && clientSecret && stripePromise && (
                    <ListGroup.Item>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripePayForm
                          orderId={orderId}
                          order={order}
                          payOrder={payOrder}
                          onSuccess={() => setClientSecret(null)}
                        />
                      </Elements>
                    </ListGroup.Item>
                  )}
                  {userInfo &&
                    userInfo.isAdmin &&
                    order?.isPaid &&
                    !order?.isDelivered && (
                      <ListGroup.Item>
                        <Button
                          onClick={deliveredHandler}
                          variant='warning'
                          disabled={isUpdateDeliverLoading}
                          style={{ marginBottom: '10px' }}
                        >
                          Mark As Delivered
                        </Button>
                      </ListGroup.Item>
                    )}
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default OrderDetailsPage;
