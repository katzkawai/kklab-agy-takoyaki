document.addEventListener('DOMContentLoaded', () => {
  /* --- State --- */
  let currentCart = JSON.parse(localStorage.getItem('takoyaki_cart')) || [];
  
  // Base details
  const bases = {
    '1': { name: '元祖 秘伝ソースたこ焼き', price: 600, defaultToppings: ['sauce', 'mayo', 'aonori', 'katsuobushi'] },
    '2': { name: 'たっぷり九条ねぎ塩たこ焼き', price: 650, defaultToppings: ['mayo', 'aonori', 'negi'] },
    '3': { name: '博多明太あぶりチーズたこ焼き', price: 700, defaultToppings: ['mayo', 'cheese', 'mentai'] },
    '4': { name: '醤油極み素焼きたこ焼き', price: 580, defaultToppings: [] }
  };

  // Topping details
  const toppings = {
    'sauce': { name: '特製ソース', price: 0 },
    'mayo': { name: '自家製マヨネーズ', price: 0 },
    'aonori': { name: '青のり', price: 0 },
    'katsuobushi': { name: '削りかつお節', price: 0 },
    'negi': { name: '九条ねぎ大盛り', price: 100 },
    'cheese': { name: '炙りチーズ', price: 120 },
    'mentai': { name: '明太子ソース', price: 100 }
  };

  /* --- DOM Elements --- */
  const header = document.querySelector('.main-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const steamContainer = document.getElementById('steam-container');
  const simBaseRadios = document.querySelectorAll('input[name="takoyaki-base"]');
  const simToppingChecks = {
    'sauce': document.getElementById('top-sauce'),
    'mayo': document.getElementById('top-mayo'),
    'aonori': document.getElementById('top-aonori'),
    'katsuobushi': document.getElementById('top-katsuobushi'),
    'negi': document.getElementById('top-negi'),
    'cheese': document.getElementById('top-cheese'),
    'mentai': document.getElementById('top-mentai')
  };
  const summaryBasePrice = document.getElementById('summary-base-price');
  const summaryToppingPrice = document.getElementById('summary-topping-price');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const cartToggle = document.getElementById('cart-toggle');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartTotalValue = document.getElementById('cart-total-value');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalOrderSummary = document.getElementById('modal-order-summary');
  const cartCountBadges = document.querySelectorAll('.cart-count');

  /* --- Steam Generator for Hero --- */
  function createSteamParticle() {
    if (!steamContainer) return;
    const particle = document.createElement('div');
    particle.classList.add('steam-particle');
    
    // Randomize positioning
    const size = Math.random() * 60 + 40;
    const left = Math.random() * 80 + 10;
    const delay = Math.random() * 2;
    const duration = Math.random() * 4 + 4;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;

    steamContainer.appendChild(particle);

    // Clean up particle
    setTimeout(() => {
      particle.remove();
    }, (duration + delay) * 1000);
  }

  // Run steam generation
  setInterval(createSteamParticle, 400);

  /* --- Navigation Scroll Tracking --- */
  window.addEventListener('scroll', () => {
    // Header shadow and transparent logic
    if (window.scrollY > 50) {
      header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255, 190, 60, 0.05)';
      header.style.backgroundColor = 'rgba(13, 9, 7, 0.95)';
    } else {
      header.style.boxShadow = 'none';
      header.style.backgroundColor = 'rgba(13, 9, 7, 0.85)';
    }

    // Nav active element highlighting
    let current = '';
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  });

  /* --- Simulator Visual Syncing --- */
  function getSelectedBase() {
    let baseId = '1';
    simBaseRadios.forEach(radio => {
      if (radio.checked) baseId = radio.value;
    });
    return baseId;
  }

  function updateVisualsAndPrices() {
    const baseId = getSelectedBase();
    const base = bases[baseId];
    
    let basePrice = base.price;
    let toppingPrice = 0;
    
    // Toggle active toppings on the visual plate
    Object.keys(simToppingChecks).forEach(toppingKey => {
      const checkbox = simToppingChecks[toppingKey];
      const isChecked = checkbox.checked;
      
      // Update visual balls layers
      const elements = document.querySelectorAll(`.topping-${toppingKey}`);
      elements.forEach(el => {
        if (isChecked) {
          el.classList.add('topping-active');
        } else {
          el.classList.remove('topping-active');
        }
      });

      // Calculate prices
      if (isChecked) {
        toppingPrice += toppings[toppingKey].price;
      }
    });

    // Update prices in DOM
    summaryBasePrice.textContent = `¥${basePrice}`;
    summaryToppingPrice.textContent = `¥${toppingPrice}`;
    const total = basePrice + toppingPrice;
    summaryTotalPrice.textContent = `¥${total}`;

    // Update Status text
    const statusText = document.getElementById('sim-status-text');
    if (statusText) {
      statusText.textContent = `${base.name} (トッピング: ${
        Object.keys(simToppingChecks)
          .filter(k => simToppingChecks[k].checked)
          .map(k => toppings[k].name)
          .join(', ') || 'なし'
      }) - 合計金額: ¥${total}`;
    }
  }

  // Set default toppings based on selected base
  function applyBaseDefaults(baseId) {
    const base = bases[baseId];
    Object.keys(simToppingChecks).forEach(toppingKey => {
      const checkbox = simToppingChecks[toppingKey];
      checkbox.checked = base.defaultToppings.includes(toppingKey);
    });
    updateVisualsAndPrices();
  }

  // Event Listeners for Base changes
  simBaseRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      applyBaseDefaults(e.target.value);
    });
  });

  // Event Listeners for Topping changes
  Object.keys(simToppingChecks).forEach(key => {
    simToppingChecks[key].addEventListener('change', () => {
      updateVisualsAndPrices();
    });
  });

  // Initialize Simulator with defaults
  applyBaseDefaults('1');

  /* --- Direct Selector from Menu items --- */
  const selectItemBtns = document.querySelectorAll('.select-item-btn');
  selectItemBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const baseId = e.target.getAttribute('data-id');
      const radio = document.querySelector(`input[name="takoyaki-base"][value="${baseId}"]`);
      if (radio) {
        radio.checked = true;
        applyBaseDefaults(baseId);
        
        // Scroll to simulator
        document.getElementById('simulator').scrollIntoView({ behavior: 'smooth' });
        
        // Brief pulse animation on the simulator plate to grab attention
        const plate = document.querySelector('.sim-plate');
        if (plate) {
          plate.style.transform = 'rotateX(15deg) scale(1.06)';
          plate.style.boxShadow = '0 20px 45px rgba(255, 190, 60, 0.4)';
          setTimeout(() => {
            plate.style.transform = '';
            plate.style.boxShadow = '';
          }, 800);
        }
      }
    });
  });

  /* --- Cart Operations --- */
  function saveCart() {
    localStorage.setItem('takoyaki_cart', JSON.stringify(currentCart));
    updateCartDOM();
  }

  function updateCartDOM() {
    // Update badge count
    let totalCount = currentCart.length;
    cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
      if (totalCount > 0) {
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
      }
    });

    // Clear list
    cartItemsList.innerHTML = '';
    
    if (currentCart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <i class="fa-solid fa-shopping-basket"></i>
          <p>カートは空です。<br>お好みのたこ焼きを追加してください。</p>
        </div>
      `;
      cartTotalValue.textContent = '¥0';
      checkoutBtn.disabled = true;
      return;
    }

    checkoutBtn.disabled = false;
    let totalCost = 0;

    currentCart.forEach(item => {
      totalCost += item.price;
      
      const itemEl = document.createElement('div');
      itemEl.classList.add('cart-item');
      
      const toppingStr = item.toppings && item.toppings.length > 0 
        ? item.toppings.join(', ') 
        : 'トッピングなし';

      itemEl.innerHTML = `
        <div class="cart-item-title">${item.baseName}</div>
        <div class="cart-item-toppings">トッピング: ${toppingStr}</div>
        <div class="cart-item-footer">
          <div class="cart-item-price">¥${item.price}</div>
          <button class="cart-item-remove" data-timestamp="${item.timestamp}"><i class="fa-regular fa-trash-can"></i> 削除</button>
        </div>
      `;
      cartItemsList.appendChild(itemEl);
    });

    cartTotalValue.textContent = `¥${totalCost}`;

    // Add remove listeners
    const removeBtns = cartItemsList.querySelectorAll('.cart-item-remove');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timestamp = parseInt(btn.getAttribute('data-timestamp'));
        currentCart = currentCart.filter(item => item.timestamp !== timestamp);
        saveCart();
      });
    });
  }

  // Add customized item to cart
  addToCartBtn.addEventListener('click', () => {
    const baseId = getSelectedBase();
    const base = bases[baseId];
    
    // Collect selected toppings names and calculate price
    const selectedToppingsNames = [];
    let calculatedPrice = base.price;

    Object.keys(simToppingChecks).forEach(toppingKey => {
      if (simToppingChecks[toppingKey].checked) {
        selectedToppingsNames.push(toppings[toppingKey].name);
        calculatedPrice += toppings[toppingKey].price;
      }
    });

    const newItem = {
      timestamp: Date.now(),
      baseId: baseId,
      baseName: base.name,
      toppings: selectedToppingsNames,
      price: calculatedPrice
    };

    currentCart.push(newItem);
    saveCart();

    // Visual feedback
    addToCartBtn.textContent = '追加しました！ ✓';
    addToCartBtn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    addToCartBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.6)';
    
    // Open sidebar automatically to show it was added
    setTimeout(() => {
      cartSidebar.classList.add('open');
      sidebarOverlay.classList.add('open');
      
      // Reset button
      addToCartBtn.textContent = 'このトッピングで注文カートに入れる';
      addToCartBtn.style.background = '';
      addToCartBtn.style.boxShadow = '';
    }, 600);
  });

  // Sidebar Controls
  cartToggle.addEventListener('click', () => {
    cartSidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  });

  cartCloseBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  });

  sidebarOverlay.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  });

  /* --- Checkout & Confetti logic --- */
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let confettiParticles = [];
  let animationFrameId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Confetti {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -canvas.height;
      this.size = Math.random() * 8 + 6;
      this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
      this.speedY = Math.random() * 4 + 3;
      this.speedX = Math.random() * 2 - 1;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
      ctx.restore();
    }
  }

  function startConfetti() {
    confettiParticles = [];
    for (let i = 0; i < 150; i++) {
      confettiParticles.push(new Confetti());
    }
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    confettiParticles.forEach(p => {
      p.update();
      p.draw();
      if (p.y < canvas.height) {
        active = true;
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  checkoutBtn.addEventListener('click', () => {
    // Generate order summary for modal
    modalOrderSummary.innerHTML = '';
    let totalCost = 0;
    
    currentCart.forEach(item => {
      totalCost += item.price;
      const row = document.createElement('div');
      row.classList.add('modal-summary-item');
      row.innerHTML = `<span>${item.baseName}</span><span>¥${item.price}</span>`;
      modalOrderSummary.appendChild(row);
    });

    // Add total row
    const totalRow = document.createElement('div');
    totalRow.classList.add('modal-summary-item');
    totalRow.innerHTML = `<span>合計金額</span><span>¥${totalCost}</span>`;
    modalOrderSummary.appendChild(totalRow);

    // Empty local cart
    currentCart = [];
    saveCart();
    
    // Close sidebar
    cartSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');

    // Show modal
    checkoutModal.classList.add('open');

    // Fire Confetti!
    startConfetti();
  });

  modalCloseBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('open');
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Initialize UI with storage load
  updateCartDOM();
});
