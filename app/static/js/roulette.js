/**
 * CS:GO Lunch Case Opener - Roulette Controller
 * Handles strip rendering, physics-based smooth deceleration, tick audio tracking, and win celebration.
 */

class CSGORoulette {
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId || 'roulette-container');
    this.strip = document.getElementById(options.stripId || 'roulette-strip');
    this.needle = document.getElementById(options.needleId || 'roulette-needle');
    this.openBtn = document.getElementById(options.openBtnId || 'btn-open-case');

    this.cardWidth = 190;
    this.cardGap = 12;
    this.cardStep = this.cardWidth + this.cardGap; // 202px

    this.isSpinning = false;
    this.animationId = null;
    this.lastCardIndexCrossed = 0;
  }

  buildCardHTML(item) {
    const isGold = item.rarity === 'gold';
    const isStatTrak = item.is_stattrak;
    const borderClass = `border-${item.rarity}`;
    const textClass = `text-${item.rarity}`;

    return `
      <div class="roulette-card ${borderClass}" data-rarity="${item.rarity}">
        <div class="flex justify-between items-center text-xs">
          <span class="px-1.5 py-0.5 rounded font-mono font-bold ${isGold ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-300'}">
            ${item.category || 'Món ăn'}
          </span>
          ${isStatTrak ? '<span class="text-xs font-bold text-orange-400">StatTrak™</span>' : ''}
        </div>

        <div class="my-auto text-center py-2">
          <div class="text-5xl mb-2 select-none transform hover:scale-110 transition-transform">
            ${item.image}
          </div>
          <div class="font-bold text-sm text-slate-100 line-clamp-2 px-1">
            ${item.name}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-700/60 flex flex-col gap-0.5">
          <div class="text-[11px] font-semibold ${textClass} truncate">
            ${item.rarity_name || item.rarity.toUpperCase()}
          </div>
          <div class="text-[11px] text-slate-400 font-mono">
            ${item.price_range}
          </div>
        </div>
      </div>
    `;
  }

  renderInitialStrip(foods) {
    if (!this.strip || !foods || foods.length === 0) return;
    this.strip.style.transition = 'none';
    this.strip.style.transform = 'translateX(0px)';
    
    // Fill ~20 preview cards
    let html = '';
    for (let i = 0; i < 20; i++) {
      const food = foods[i % foods.length];
      html += this.buildCardHTML({
        ...food,
        rarity_name: food.rarity.toUpperCase()
      });
    }
    this.strip.innerHTML = html;
  }

  async roll(caseId) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    if (this.openBtn) {
      this.openBtn.disabled = true;
      this.openBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ĐANG QUAY HÒM...
      `;
    }

    try {
      if (window.csgoAudio) {
        window.csgoAudio.playRollStart();
      }

      // Fetch roll result from FastAPI server
      const response = await fetch(`/api/open-case/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Lỗi khi mở hòm: ' + response.statusText);
      }

      const data = await response.json();
      await this.animateRoulette(data);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra: ' + err.message);
      this.resetButton();
    }
  }

  animateRoulette(data) {
    return new Promise((resolve) => {
      const { items, winner_index, winning_item, jitter_px } = data;

      // 1. Render all 55 strip cards
      this.strip.style.transition = 'none';
      this.strip.style.transform = 'translateX(0px)';
      this.strip.innerHTML = items.map(item => this.buildCardHTML(item)).join('');

      // Force layout reflow
      void this.strip.offsetWidth;

      // 2. Compute target translation
      const containerWidth = this.container.offsetWidth;
      const targetCardCenter = (winner_index * this.cardStep) + (this.cardWidth / 2);
      const totalTranslateX = targetCardCenter + jitter_px - (containerWidth / 2);

      // 3. Set CS:GO Physics Deceleration Transition
      const spinDuration = 5.5; // seconds
      this.strip.style.transition = `transform ${spinDuration}s cubic-bezier(0.12, 0.8, 0.15, 1.0)`;
      this.strip.style.transform = `translateX(-${totalTranslateX}px)`;

      // 4. Start tick audio listener
      this.lastCardIndexCrossed = 0;
      const startTime = performance.now();

      const trackTicks = (now) => {
        const elapsed = (now - startTime) / 1000;
        if (elapsed >= spinDuration) {
          cancelAnimationFrame(this.animationId);
          return;
        }

        // Get current translateX using getComputedStyle
        const style = window.getComputedStyle(this.strip);
        const matrix = new DOMMatrixReadOnly(style.transform);
        const currentX = Math.abs(matrix.m41);

        // Center needle position in strip coordinates
        const needleStripPos = currentX + (containerWidth / 2);
        const currentCardIndex = Math.floor(needleStripPos / this.cardStep);

        if (currentCardIndex > this.lastCardIndexCrossed) {
          this.lastCardIndexCrossed = currentCardIndex;
          if (window.csgoAudio) {
            window.csgoAudio.playTick();
          }
        }

        this.animationId = requestAnimationFrame(trackTicks);
      };

      this.animationId = requestAnimationFrame(trackTicks);

      // 5. On animation completion
      setTimeout(() => {
        cancelAnimationFrame(this.animationId);
        this.isSpinning = false;
        this.resetButton();

        // Reveal winner celebration
        if (window.csgoAudio) {
          window.csgoAudio.playWinReveal(winning_item.rarity);
        }

        this.showWinnerModal(winning_item, data.case_name);
        resolve();
      }, (spinDuration * 1000) + 100);
    });
  }

  resetButton() {
    this.isSpinning = false;
    if (this.openBtn) {
      this.openBtn.disabled = false;
      this.openBtn.innerHTML = `
        <span class="text-xl mr-2">🔓</span> MỞ HÒM (KEY: 0 ĐỒNG)
      `;
    }
  }

  showWinnerModal(item, caseName) {
    const modal = document.getElementById('winner-modal');
    if (!modal) return;

    const isGold = item.rarity === 'gold';
    const isCovert = item.rarity === 'covert';
    const glowClass = `glow-${item.rarity}`;

    // Populate modal contents
    document.getElementById('modal-case-name').innerText = caseName || 'Hòm Mở Thưởng';
    document.getElementById('modal-item-image').innerText = item.image;
    document.getElementById('modal-item-name').innerText = item.name;
    document.getElementById('modal-item-rarity').innerText = item.rarity_name;
    document.getElementById('modal-item-rarity').style.color = item.color;
    document.getElementById('modal-item-price').innerText = item.price_range;
    document.getElementById('modal-item-desc').innerText = item.description;
    
    // Float & Wear
    document.getElementById('modal-item-wear').innerText = item.wear || 'Standard';
    document.getElementById('modal-item-float').innerText = item.float_value ? item.float_value.toFixed(4) : '0.1234';

    // StatTrak badge
    const stattrakBadge = document.getElementById('modal-stattrak-badge');
    if (stattrakBadge) {
      if (item.is_stattrak) {
        stattrakBadge.classList.remove('hidden');
        stattrakBadge.innerText = `StatTrak™ (Đã ăn: ${item.stattrak_count} lần)`;
      } else {
        stattrakBadge.classList.add('hidden');
      }
    }

    // Google Maps Link
    const mapBtn = document.getElementById('modal-map-link');
    if (mapBtn) {
      mapBtn.href = `https://www.google.com/maps/search/${encodeURIComponent(item.name + ' gần đây')}`;
    }

    // Modal frame styling
    const modalCard = document.getElementById('modal-card-box');
    modalCard.className = `winner-card-3d rounded-xl p-8 border-2 border-${item.rarity} ${glowClass} ${isGold ? 'pulse-gold' : ''}`;

    // Show modal with fade-in
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Confetti effect if Covert or Gold!
    if (isGold || isCovert) {
      this.triggerConfetti();
    }
  }

  triggerConfetti() {
    // Simple colorful confetti burst
    const colors = ['#ffd700', '#eb4b4b', '#d32ce6', '#4b69ff', '#ffffff'];
    const container = document.body;
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.className = 'fixed z-50 pointer-events-none rounded-full';
      el.style.width = `${Math.random() * 8 + 6}px`;
      el.style.height = `${Math.random() * 8 + 6}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = `${50 + (Math.random() * 40 - 20)}%`;
      el.style.top = `${40 + (Math.random() * 30 - 15)}%`;
      el.style.transition = 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
      container.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transform = `translate(${(Math.random() - 0.5) * 500}px, ${(Math.random() - 0.5) * 500}px) scale(0)`;
        el.style.opacity = '0';
      });

      setTimeout(() => el.remove(), 1600);
    }
  }
}

// Global initialization helper
window.initCSGORoulette = (initialFoods) => {
  window.rouletteInstance = new CSGORoulette();
  window.rouletteInstance.renderInitialStrip(initialFoods);
};
