const express = require('express');
const app = express();
app.use(express.json());

let users = {};
let wallets = {};

class Wallet {
  constructor(userId) {
    this.userId = userId;
    this.balance = 0;
    this.estimatedTalktime = this.calculateTalktime();
  }

  calculateTalktime() {
    const talktimePerUnit = 2;
    return `${this.balance * talktimePerUnit} minutes`;
  }

  topUp(amount) {
    this.balance += amount;
    this.estimatedTalktime = this.calculateTalktime();
  }
}

class WalletService {
  static createWallet(userId) {
    if (wallets[userId]) {
      return wallets[userId];
    }
    const newWallet = new Wallet(userId);
    wallets[userId] = newWallet;
    return newWallet;
  }

  static getWallet(userId) {
    return wallets[userId] || null;
  }

  static topUpWallet(userId, amount) {
    if (!wallets[userId]) {
      return null;
    }
    const wallet = wallets[userId];
    wallet.topUp(amount);
    return wallet;
  }
}

class PaymentService {
  static async initiatePayment(amount) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2;
        resolve({ success });
      }, 2000);
    });
  }
}

app.post('/register', (req, res) => {
  const { userId } = req.body;

  if (users[userId]) {
    return res.status(400).json({ message: 'User already registered.' });
  }

  users[userId] = { userId };
  WalletService.createWallet(userId);

  return res.status(201).json({ message: 'User registered and wallet created.' });
});

app.get('/wallet/:userId', (req, res) => {
  const { userId } = req.params;

  const wallet = WalletService.getWallet(userId);
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found.' });
  }

  return res.json({
    balance: wallet.balance,
    estimatedTalktime: wallet.estimatedTalktime,
  });
});

app.post('/wallet/:userId/top-up', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount.' });
  }

  const paymentResponse = await PaymentService.initiatePayment(amount);
  if (paymentResponse.success) {
    const wallet = WalletService.topUpWallet(userId, amount);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found.' });
    }

    return res.json({
      balance: wallet.balance,
      estimatedTalktime: wallet.estimatedTalktime,
      message: 'Wallet topped up successfully.',
    });
  } else {
    return res.status(400).json({ message: 'Payment failed. Try again.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
