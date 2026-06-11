/**
 * PesaPal Payment Manager
 * ---------------------------------------------------------------------------
 * PesaPal requires a server-side backend to:
 *   1. Authenticate and get an OAuth token
 *   2. Register an IPN URL
 *   3. Submit an order and get a redirect URL
 *
 * This client-side module:
 *   - Shows the payment modal with order summary
 *   - Redirects to PesaPal's hosted checkout (iframe or new tab)
 *   - Polls/listens for the redirect-back callback
 *
 * ⚠️  Replace PESAPAL_BACKEND_URL with your actual backend endpoint.
 *     A minimal Node.js/Express backend example is included at the bottom
 *     of this file as a comment.
 *
 * For testing use the PesaPal Sandbox:
 *   https://cybqa.pesapal.com/pesapalv3
 * ---------------------------------------------------------------------------
 */

const PESAPAL_BACKEND_URL = 'https://yourdomain.com/api/pesapal'; // ← change this

const PesaPalManager = {
  modal: null,
  currentOrder: null,

  init() {
    this.modal = document.createElement('div');
    this.modal.id = 'pesapalModal';
    this.modal.className = 'fixed inset-0 z-[120] hidden items-center justify-center bg-black/70 backdrop-blur-sm px-4 opacity-0 transition-opacity duration-300';
    this.modal.innerHTML = `
      <div id="pesapalModalBox" class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 scale-95 transition-transform duration-300">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="ph-fill ph-credit-card text-xl"></i>
            <h3 class="font-bold text-lg">Secure Checkout</h3>
          </div>
          <button onclick="PesaPalManager.close()" class="text-white/80 hover:text-white transition">
            <i class="ph-bold ph-x text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Step 1: Order summary & customer info -->
          <div id="ppStep1">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-5 border border-gray-100 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Order Summary</p>
              <p class="font-semibold text-gray-800 dark:text-white" id="ppProductName"></p>
              <p class="text-green-600 dark:text-green-400 font-extrabold text-2xl mt-1">KES <span id="ppAmount"></span></p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" id="ppName" placeholder="John Doe"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input type="email" id="ppEmail" placeholder="you@example.com"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (M-PESA/Card)</label>
                <input type="tel" id="ppPhone" placeholder="0712 345 678"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition">
              </div>
            </div>

            <p class="text-xs text-gray-400 dark:text-gray-500 mt-4 flex items-center gap-1">
              <i class="ph-fill ph-lock-simple text-green-500"></i>
              Powered by PesaPal — supports M-PESA, Visa, Mastercard & Airtel Money.
            </p>

            <button onclick="PesaPalManager.submitOrder()"
              class="w-full mt-5 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2">
              <i class="ph-fill ph-arrow-right text-lg"></i> Proceed to Payment
            </button>
          </div>

          <!-- Step 2: Redirect / loading -->
          <div id="ppStep2" class="hidden text-center py-6">
            <div class="mpesa-loader mb-5 mx-auto"></div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Redirecting to PesaPal…</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">You'll be taken to the secure PesaPal checkout page.<br>Complete payment there and you'll be redirected back.</p>
            <p class="text-xs text-green-500 mt-4 font-semibold animate-pulse">Opening payment gateway…</p>
          </div>

          <!-- Step 3: Success (shown if redirected back with success status) -->
          <div id="ppStep3" class="hidden text-center py-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4 text-4xl">
              <i class="ph-fill ph-check-circle"></i>
            </div>
            <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Received!</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Thank you! We'll confirm your order shortly.</p>
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left border border-gray-100 dark:border-gray-700">
              <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Reference</p>
              <p class="font-mono font-bold text-gray-900 dark:text-white text-lg" id="ppReference"></p>
            </div>
            <button onclick="PesaPalManager.close()"
              class="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-4 rounded-xl transition">
              Done
            </button>
          </div>

          <!-- Step 4: Error -->
          <div id="ppStep4" class="hidden text-center py-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 text-4xl">
              <i class="ph-fill ph-x-circle"></i>
            </div>
            <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6" id="ppErrorMsg">Something went wrong. Please try again.</p>
            <button onclick="PesaPalManager.showStep(1)"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition">
              Try Again
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    // Check for PesaPal redirect-back params on page load
    this.checkRedirectBack();
  },

  showStep(n) {
    [1,2,3,4].forEach(i => {
      document.getElementById(`ppStep${i}`)?.classList.toggle('hidden', i !== n);
    });
  },

  open(productName, price) {
    this.currentOrder = { productName, price };
    document.getElementById('ppProductName').textContent = productName;
    document.getElementById('ppAmount').textContent = price.toLocaleString();
    document.getElementById('ppName').value = '';
    document.getElementById('ppEmail').value = '';
    document.getElementById('ppPhone').value = '';
    this.showStep(1);

    const modal = this.modal;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    document.getElementById('pesapalModalBox').classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
  },

  validate() {
    const name  = document.getElementById('ppName').value.trim();
    const email = document.getElementById('ppEmail').value.trim();
    const phone = document.getElementById('ppPhone').value.trim();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) { this.highlight('ppName'); return false; }
    if (!email || !emailRx.test(email)) { this.highlight('ppEmail'); return false; }
    if (!phone || phone.length < 9)  { this.highlight('ppPhone'); return false; }
    return { name, email, phone };
  },

  highlight(id) {
    const el = document.getElementById(id);
    el.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    el.focus();
    setTimeout(() => el.classList.remove('border-red-500', 'ring-1', 'ring-red-500'), 2000);
  },

  async submitOrder() {
    const fields = this.validate();
    if (!fields) return;

    this.showStep(2);

    const orderRef = `WGE-${Date.now()}`;

    try {
      /**
       * REAL INTEGRATION:
       * POST to your backend which will:
       *   1. Auth with PesaPal → get token
       *   2. Register IPN if not done
       *   3. Submit order → get redirect_url
       *   4. Return { redirect_url, order_tracking_id }
       *
       * const res = await fetch(`${PESAPAL_BACKEND_URL}/submit-order`, {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({
       *     reference: orderRef,
       *     amount: this.currentOrder.price,
       *     currency: 'KES',
       *     description: this.currentOrder.productName,
       *     billing: {
       *       email_address: fields.email,
       *       phone_number: fields.phone,
       *       first_name: fields.name.split(' ')[0],
       *       last_name: fields.name.split(' ').slice(1).join(' ') || '-',
       *     }
       *   })
       * });
       * const { redirect_url } = await res.json();
       * window.location.href = redirect_url;   // or open in iframe
       */

      // ── DEMO MODE (no backend yet) ──────────────────────────────────────
      // Simulates what would happen after a real redirect + callback.
      // Remove the block below once your backend is live.
      await new Promise(r => setTimeout(r, 2000));
      document.getElementById('ppReference').textContent = orderRef;
      this.showStep(3);
      // ────────────────────────────────────────────────────────────────────

    } catch (err) {
      console.error('PesaPal error:', err);
      document.getElementById('ppErrorMsg').textContent = err.message || 'Something went wrong. Please try again.';
      this.showStep(4);
    }
  },

  /** Called on page load — checks if PesaPal redirected back with status params */
  checkRedirectBack() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('pesapal_transaction_tracking_id') || params.get('OrderTrackingId');
    const ref    = params.get('OrderMerchantReference');

    if (status && ref) {
      // Clean URL without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Verify server-side if possible; for now show success
      document.getElementById('ppReference').textContent = ref;
      this.open('Order', 0); // open modal
      this.showStep(3);
    }
  },

  close() {
    const modal = this.modal;
    modal.classList.add('opacity-0');
    document.getElementById('pesapalModalBox').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }, 300);
  }
};


/*
 * ============================================================================
 * MINIMAL NODE.JS / EXPRESS BACKEND  (save as server.js and run separately)
 * ============================================================================
 *
 * npm install express axios cors dotenv
 *
 * .env:
 *   PESAPAL_CONSUMER_KEY=...
 *   PESAPAL_CONSUMER_SECRET=...
 *   PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3   # sandbox
 *   IPN_URL=https://yourdomain.com/api/pesapal/ipn
 *   REDIRECT_URL=https://yourdomain.com/payment/callback
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * const express = require('express');
 * const axios = require('axios');
 * const cors = require('cors');
 * require('dotenv').config();
 *
 * const app = express();
 * app.use(cors(), express.json());
 *
 * const BASE = process.env.PESAPAL_BASE_URL;
 * let cachedToken = null, tokenExpiry = 0;
 *
 * async function getToken() {
 *   if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
 *   const { data } = await axios.post(`${BASE}/api/Auth/RequestToken`, {
 *     consumer_key: process.env.PESAPAL_CONSUMER_KEY,
 *     consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
 *   });
 *   cachedToken = data.token;
 *   tokenExpiry = Date.now() + (data.expiryDate ? new Date(data.expiryDate) - Date.now() : 3600000);
 *   return cachedToken;
 * }
 *
 * let cachedIpnId = null;
 * async function getIpnId(token) {
 *   if (cachedIpnId) return cachedIpnId;
 *   const { data } = await axios.post(`${BASE}/api/URLSetup/RegisterIPN`, {
 *     url: process.env.IPN_URL,
 *     ipn_notification_type: 'GET',
 *   }, { headers: { Authorization: `Bearer ${token}` } });
 *   cachedIpnId = data.ipn_id;
 *   return cachedIpnId;
 * }
 *
 * app.post('/api/pesapal/submit-order', async (req, res) => {
 *   try {
 *     const token = await getToken();
 *     const ipnId = await getIpnId(token);
 *     const { reference, amount, currency, description, billing } = req.body;
 *
 *     const { data } = await axios.post(`${BASE}/api/Transactions/SubmitOrderRequest`, {
 *       id: reference,
 *       currency,
 *       amount,
 *       description,
 *       callback_url: process.env.REDIRECT_URL,
 *       notification_id: ipnId,
 *       billing_address: billing,
 *     }, { headers: { Authorization: `Bearer ${token}` } });
 *
 *     res.json({ redirect_url: data.redirect_url, order_tracking_id: data.order_tracking_id });
 *   } catch (err) {
 *     console.error(err.response?.data || err.message);
 *     res.status(500).json({ error: 'Payment initiation failed' });
 *   }
 * });
 *
 * app.get('/api/pesapal/ipn', (req, res) => {
 *   // PesaPal pings this URL after payment — log and return 200
 *   console.log('IPN received:', req.query);
 *   res.sendStatus(200);
 * });
 *
 * app.listen(3001, () => console.log('Backend on http://localhost:3001'));
 * ============================================================================
 */
