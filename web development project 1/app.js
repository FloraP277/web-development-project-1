// App JS for EarthArmor Packaging - interactive features

// Cart: simple client-side cart persisted to localStorage
function getCart() {
  try { return JSON.parse(localStorage.getItem('ea_cart') || '[]'); } catch (e) { return []; }
}

function saveCart(cart) { 
  localStorage.setItem('ea_cart', JSON.stringify(cart)); 
  renderCart(); 
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const cart = getCart();
  
  if (!itemsEl || !totalEl) return;
  
  itemsEl.innerHTML = '';
  let total = 0;
  
  cart.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    const thumb = it.image ? `<img src="${escapeHtml(it.image)}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" onerror="this.onerror=null;this.src='assets/placeholder.svg'">` : `<div style="width:64px;height:64px;background:#f0f0f0;border-radius:6px"></div>`;
    row.innerHTML = `
      <div>${thumb}</div>
      <div class="info" style="flex:1;margin-left:10px;">
        <div class="fw-bold">${escapeHtml(it.name)}</div>
        <div class="small text-muted">$${it.price.toFixed(2)} each</div>
        <div class="mt-1">
          <button class="btn btn-sm btn-outline-secondary me-1 cart-decrease" data-idx="${idx}">-</button>
          <input class="form-control form-control-sm text-center cart-qty" data-idx="${idx}" style="width:60px;display:inline-block;" value="${it.qty}" />
          <button class="btn btn-sm btn-outline-secondary ms-1 cart-increase" data-idx="${idx}">+</button>
        </div>
      </div>
      <div class="text-end">
        <div class="fw-bold">$${(it.price*it.qty).toFixed(2)}</div>
        <button class="btn btn-link btn-sm text-danger cart-remove" data-idx="${idx}">Remove</button>
      </div>
    `;
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.padding = '10px 0';
    row.style.borderBottom = '1px solid #eee';
    itemsEl.appendChild(row);
    total += it.price * it.qty;
  });
  
  totalEl.textContent = total.toFixed(2);
  
  // update navbar cart count
  const countEl = document.getElementById('navCartCount');
  if (countEl) countEl.textContent = cart.reduce((s,i) => s + i.qty, 0);

  // update mini-cart preview
  const preview = document.getElementById('miniCartPreview');
  if (preview) {
    if (cart.length === 0) {
      preview.innerHTML = '<div class="text-muted small">Cart is empty</div>';
    } else {
      preview.innerHTML = '';
      cart.slice(0,5).forEach(it => {
        const img = it.image ? `<img src="${escapeHtml(it.image)}" style="width:46px;height:46px;object-fit:cover;border-radius:6px;margin-right:8px;" onerror="this.onerror=null;this.src='assets/placeholder.svg'">` : '';
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.gap = '8px';
        item.style.padding = '8px 0';
        item.style.borderBottom = '1px solid #eee';
        item.innerHTML = `${img}<div><div style="font-size:0.9rem;font-weight:600;">${escapeHtml(it.name)}</div><div style="font-size:0.85rem;color:#666;">x${it.qty} • $${(it.price*it.qty).toFixed(2)}</div></div>`;
        preview.appendChild(item);
      });
      if (cart.length > 5) {
        const more = document.createElement('div');
        more.className = 'text-muted small mt-2';
        more.textContent = `and ${cart.length-5} more...`;
        preview.appendChild(more);
      }
    }
  }
}

function addToCart(product) {
  const cart = getCart();
  const qty = product.qty && product.qty > 0 ? parseInt(product.qty, 10) : 1;
  const existing = cart.find(c => c.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      qty, 
      image: product.image || '' 
    });
  }
  saveCart(cart);
}

function removeCartItem(idx) {
  const cart = getCart();
  cart.splice(idx,1);
  saveCart(cart);
}

function clearCart() { 
  saveCart([]); 
}

// Checkout functionality
function openCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // Populate checkout summary
  const summaryEl = document.getElementById('checkoutSummary');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const shippingEl = document.getElementById('checkoutShipping');
  const totalEl = document.getElementById('checkoutTotal');
  
  if (summaryEl) {
    summaryEl.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between mb-2';
      row.innerHTML = `
        <span>${escapeHtml(item.name)} × ${item.qty}</span>
        <span>$${(item.price * item.qty).toFixed(2)}</span>
      `;
      summaryEl.appendChild(row);
    });
  }
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shipping;
  
  if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2);
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
  
  // Show the modal
  const modalEl = document.getElementById('checkoutModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

function processCheckout() {
  // Get form values
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  
  // Simple validation
  const requiredFields = ['checkoutName', 'checkoutEmail', 'checkoutAddress', 'checkoutCity', 'checkoutZip', 'checkoutCountry'];
  let isValid = true;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      if (!field.value.trim()) {
        field.classList.add('is-invalid');
        isValid = false;
      } else {
        field.classList.remove('is-invalid');
      }
    }
  });
  
  // Email validation
  const emailField = document.getElementById('checkoutEmail');
  if (emailField && emailField.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      emailField.classList.add('is-invalid');
      isValid = false;
    }
  }
  
  // Card validation (basic)
  const cardNumber = document.getElementById('checkoutCard');
  const cardExpiry = document.getElementById('checkoutExpiry');
  const cardCvv = document.getElementById('checkoutCvv');
  
  if (cardNumber && !cardNumber.value.replace(/\s/g, '').match(/^\d{13,19}$/)) {
    cardNumber.classList.add('is-invalid');
    isValid = false;
  } else if (cardNumber) {
    cardNumber.classList.remove('is-invalid');
  }
  
  if (cardExpiry && !cardExpiry.value.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
    cardExpiry.classList.add('is-invalid');
    isValid = false;
  } else if (cardExpiry) {
    cardExpiry.classList.remove('is-invalid');
  }
  
  if (cardCvv && !cardCvv.value.match(/^\d{3,4}$/)) {
    cardCvv.classList.add('is-invalid');
    isValid = false;
  } else if (cardCvv) {
    cardCvv.classList.remove('is-invalid');
  }
  
  if (!isValid) {
    return;
  }
  
  // Get order details for confirmation
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shipping;
  const orderNumber = 'EA-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Store order info for confirmation
  const orderInfo = {
    orderNumber: orderNumber,
    items: cart,
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    customerName: document.getElementById('checkoutName').value,
    customerEmail: document.getElementById('checkoutEmail').value,
    shippingAddress: {
      address: document.getElementById('checkoutAddress').value,
      city: document.getElementById('checkoutCity').value,
      zip: document.getElementById('checkoutZip').value,
      country: document.getElementById('checkoutCountry').value
    },
    date: new Date().toLocaleDateString()
  };
  
  // Save order to localStorage (for demo purposes)
  const orders = JSON.parse(localStorage.getItem('ea_orders') || '[]');
  orders.push(orderInfo);
  localStorage.setItem('ea_orders', JSON.stringify(orders));
  
  // Clear cart
  clearCart();
  
  // Hide checkout modal
  const checkoutModalEl = document.getElementById('checkoutModal');
  if (checkoutModalEl) {
    const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl);
    if (checkoutModal) checkoutModal.hide();
  }
  
  // Show confirmation
  showOrderConfirmation(orderInfo);
}

function showOrderConfirmation(orderInfo) {
  // Populate confirmation modal
  const orderNumEl = document.getElementById('confirmOrderNumber');
  const orderEmailEl = document.getElementById('confirmEmail');
  const orderItemsEl = document.getElementById('confirmItems');
  const orderTotalEl = document.getElementById('confirmTotal');
  
  if (orderNumEl) orderNumEl.textContent = orderInfo.orderNumber;
  if (orderEmailEl) orderEmailEl.textContent = orderInfo.customerEmail;
  if (orderTotalEl) orderTotalEl.textContent = '$' + orderInfo.total.toFixed(2);
  
  if (orderItemsEl) {
    orderItemsEl.innerHTML = '';
    orderInfo.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between';
      row.innerHTML = `<span>${escapeHtml(item.name)} × ${item.qty}</span><span>$${(item.price * item.qty).toFixed(2)}</span>`;
      orderItemsEl.appendChild(row);
    });
  }
  
  // Show confirmation modal
  const confirmModalEl = document.getElementById('orderConfirmModal');
  if (confirmModalEl) {
    const confirmModal = new bootstrap.Modal(confirmModalEl);
    confirmModal.show();
  }
}

// Format card number with spaces
function formatCardNumber(input) {
  let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
  let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
  input.value = formatted.substring(0, 19);
}

// Format expiry date
function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  input.value = value;
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(unsafe).replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Live Chat functionality
function appendChatMessage(text, from='support') {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  
  const div = document.createElement('div');
  div.className = from === 'me' ? 'text-end mb-2' : 'text-start mb-2';
  
  const bubble = document.createElement('div');
  bubble.style.display = 'inline-block';
  bubble.style.padding = '8px 12px';
  bubble.style.borderRadius = '12px';
  bubble.style.maxWidth = '80%';
  bubble.style.wordWrap = 'break-word';
  
  if (from === 'me') {
    bubble.style.background = 'var(--primary)';
    bubble.style.color = 'white';
  } else {
    bubble.style.background = '#e9ecef';
    bubble.style.color = '#333';
  }
  
  bubble.textContent = text;
  div.innerHTML = `<small class="text-muted d-block mb-1">${from==='me'?'You':'Support'}</small>`;
  div.appendChild(bubble);
  box.appendChild(div);
  
  const body = document.getElementById('chatBody');
  if (body) body.scrollTop = body.scrollHeight;
}

function simulateSupplierReply(userMessage) {
  const responses = [
    'Thanks for reaching out! How can we help you today?',
    'Hello! A supplier representative will be with you shortly.',
    'We appreciate your interest. Let me connect you with the right team.',
    'Thank you for contacting us. What type of packaging are you looking for?',
    'Hi there! We\'re here to help you find sustainable packaging solutions.',
    'Great question! Let me get you more information about that.',
    'I\'ll connect you with one of our packaging experts right away.'
  ];
  
  // Show typing indicator
  setTimeout(() => {
    const typing = document.createElement('div');
    typing.id = 'typingIndicator';
    typing.className = 'text-start mb-2';
    typing.innerHTML = '<small class="text-muted"><em>Support is typing...</em></small>';
    const box = document.getElementById('chatMessages');
    if (box) box.appendChild(typing);
    const body = document.getElementById('chatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }, 500);
  
  // Remove typing indicator and show response
  setTimeout(() => {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
    const response = responses[Math.floor(Math.random() * responses.length)];
    appendChatMessage(response, 'support');
  }, 1500 + Math.random()*1000);
}

// Footprint Calculator
function calculateFootprint() {
  const annualPackagingEl = document.getElementById('annualPackaging');
  const plasticSlider = document.getElementById('plasticPercentage');
  const resultsPlaceholder = document.getElementById('resultsPlaceholder');
  const resultsContent = document.getElementById('resultsContent');
  
  if (!annualPackagingEl || !plasticSlider) return;
  
  const annual = parseFloat(annualPackagingEl.value || '0');
  const plasticPct = parseFloat(plasticSlider.value || '0');
  const plasticTons = (annual * (plasticPct / 100));

  if (resultsPlaceholder) resultsPlaceholder.style.display = 'none';
  if (resultsContent) resultsContent.style.display = 'block';

  const progressBar = document.querySelector('#resultsContent .progress-bar');
  if (progressBar) {
    const pct = Math.min(100, Math.round(plasticPct));
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', pct);
    progressBar.textContent = plasticTons.toFixed(2) + ' tons';
  }

  const resultsText = document.querySelector('#resultsContent p');
  if (resultsText) {
    resultsText.innerHTML = `Based on your inputs, you use approximately <strong>${plasticTons.toFixed(2)} tons</strong> of plastic packaging annually.`;
  }
}

// Event delegation for dynamic buttons
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!target) return;

  // Cart controls
  if (target.matches('.cart-increase')) {
    const idx = parseInt(target.getAttribute('data-idx'),10);
    const cart = getCart(); 
    if (!cart[idx]) return; 
    cart[idx].qty += 1; 
    saveCart(cart); 
    return;
  }
  
  if (target.matches('.cart-decrease')) {
    const idx = parseInt(target.getAttribute('data-idx'),10);
    const cart = getCart(); 
    if (!cart[idx]) return; 
    cart[idx].qty = Math.max(1, cart[idx].qty - 1); 
    saveCart(cart); 
    return;
  }
  
  if (target.matches('.cart-remove')) {
    const idx = parseInt(target.getAttribute('data-idx'),10);
    removeCartItem(idx); 
    return;
  }
});

// Qty input change handler
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target && target.matches('.cart-qty')) {
    const idx = parseInt(target.getAttribute('data-idx'),10);
    const val = Math.max(1, parseInt(target.value,10) || 1);
    const cart = getCart(); 
    if (!cart[idx]) return; 
    cart[idx].qty = val; 
    saveCart(cart);
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize cart
  renderCart();
  
  // Plastic percentage slider
  const plasticSlider = document.getElementById('plasticPercentage');
  const plasticValue = document.getElementById('plasticValue');
  if (plasticSlider && plasticValue) {
    plasticValue.textContent = plasticSlider.value + '%';
    plasticSlider.addEventListener('input', function() {
      plasticValue.textContent = this.value + '%';
    });
  }
  
  // Chat widget wiring
  const send = document.getElementById('sendChatBtn');
  const input = document.getElementById('chatInput');
  const toggle = document.getElementById('toggleChatBtn');
  
  if (send) {
    send.addEventListener('click', () => { 
      const v = input.value.trim(); 
      if (!v) return; 
      appendChatMessage(v, 'me'); 
      const userMsg = v;
      input.value = ''; 
      simulateSupplierReply(userMsg); 
    });
  }
  
  if (input) {
    input.addEventListener('keydown', (ev) => { 
      if (ev.key === 'Enter') { 
        ev.preventDefault(); 
        if (send) send.click(); 
      } 
    });
  }
  
  if (toggle) {
    toggle.addEventListener('click', () => { 
      const chatBody = document.getElementById('chatBody');
      const chatFooter = document.getElementById('chatFooter');
      
      if (chatBody && chatFooter) {
        const isHidden = chatBody.style.display === 'none';
        chatBody.style.display = isHidden ? 'block' : 'none';
        chatFooter.style.display = isHidden ? 'flex' : 'none';
        toggle.innerHTML = isHidden ? '−' : '+';
      }
    });
  }
  
  // Cart buttons
  const clearCartBtn = document.getElementById('clearCartBtn');
  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  
  const checkoutBtnEl = document.getElementById('checkoutBtn');
  if (checkoutBtnEl) {
    checkoutBtnEl.addEventListener('click', openCheckout);
  }
  
  const viewCartBtn = document.getElementById('viewCartBtn');
  if (viewCartBtn) {
    viewCartBtn.addEventListener('click', () => { 
      const offcanvasEl = document.getElementById('cartOffcanvas');
      if (offcanvasEl) {
        const off = new bootstrap.Offcanvas(offcanvasEl); 
        off.show(); 
      }
    });
  }
  
  const miniCheckoutBtn = document.getElementById('miniCheckoutBtn');
  if (miniCheckoutBtn) {
    miniCheckoutBtn.addEventListener('click', openCheckout);
  }
  
  // Place order button
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', processCheckout);
  }
  
  // Card formatting
  const cardInput = document.getElementById('checkoutCard');
  if (cardInput) {
    cardInput.addEventListener('input', function() { formatCardNumber(this); });
  }
  
  const expiryInput = document.getElementById('checkoutExpiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', function() { formatExpiry(this); });
  }
  
  const cvvInput = document.getElementById('checkoutCvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 4);
    });
  }
});

// Make functions globally accessible
window.addToCart = addToCart;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.calculateFootprint = calculateFootprint;
window.openCheckout = openCheckout;
window.processCheckout = processCheckout;

