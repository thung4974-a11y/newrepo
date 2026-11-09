/**
 * Main application JS for CS:GO Lunch Case Opener
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Audio toggle button
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');

  function updateSoundUI() {
    if (!window.csgoAudio) return;
    const isMuted = window.csgoAudio.isMuted();
    if (soundIcon) soundIcon.innerText = isMuted ? '🔇' : '🔊';
    if (soundText) soundText.innerText = isMuted ? 'Âm thanh: TẮT' : 'Âm thanh: BẬT';
    if (soundToggleBtn) {
      soundToggleBtn.className = isMuted 
        ? 'flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs transition border border-slate-700'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 text-xs transition border border-emerald-700/50';
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (window.csgoAudio) {
        window.csgoAudio.toggleMute();
        updateSoundUI();
      }
    });
    updateSoundUI();
  }

  // 2. Winner Modal Close & Reroll handlers
  const winnerModal = document.getElementById('winner-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const rerollBtn = document.getElementById('btn-reroll-modal');

  function closeModal() {
    if (winnerModal) {
      winnerModal.classList.add('hidden');
      winnerModal.classList.remove('flex');
    }
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (rerollBtn) {
    rerollBtn.addEventListener('click', () => {
      closeModal();
      const openBtn = document.getElementById('btn-open-case');
      if (openBtn) {
        openBtn.click();
      }
    });
  }

  // Close modal on outside backdrop click
  if (winnerModal) {
    winnerModal.addEventListener('click', (e) => {
      if (e.target === winnerModal) {
        closeModal();
      }
    });
  }

  // Keyboard shortcut: Escape closes modal, Space triggers open if not spinning
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && winnerModal && !winnerModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 3. Trade-Up Contract Logic (if on tradeup page)
  initTradeUpLogic();
});

/**
 * Trade-Up Contract UI
 */
function initTradeUpLogic() {
  const tradeupContainer = document.getElementById('tradeup-container');
  if (!tradeupContainer) return;

  const selectedSlotContainer = document.getElementById('selected-slots');
  const availableFoodsList = document.getElementById('available-tradeup-foods');
  const signContractBtn = document.getElementById('btn-sign-contract');
  const resultModal = document.getElementById('tradeup-result-modal');

  let selectedItems = []; // max 5

  function updateSlotsUI() {
    const slots = selectedSlotContainer.querySelectorAll('.tradeup-slot');
    slots.forEach((slot, idx) => {
      const item = selectedItems[idx];
      if (item) {
        slot.innerHTML = `
          <div class="relative w-full h-full p-2 flex flex-col items-center justify-between bg-slate-900 border-2 border-${item.rarity} rounded shadow-lg group">
            <span class="text-3xl">${item.image}</span>
            <span class="text-xs font-bold text-center line-clamp-1">${item.name}</span>
            <button type="button" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold hover:bg-red-500" onclick="removeTradeupItem(${idx})">×</button>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <div class="w-full h-full border-2 border-dashed border-slate-700 rounded flex flex-col items-center justify-center text-slate-500 hover:border-slate-500 transition">
            <span class="text-2xl opacity-40">➕</span>
            <span class="text-[11px] font-mono mt-1">Ô #${idx + 1}</span>
          </div>
        `;
      }
    });

    // Validate button
    if (selectedItems.length === 5) {
      // Check all same rarity
      const rarities = new Set(selectedItems.map(i => i.rarity));
      if (rarities.size === 1 && !rarities.has('gold')) {
        signContractBtn.disabled = false;
        signContractBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        signContractBtn.disabled = true;
        signContractBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    } else {
      signContractBtn.disabled = true;
      signContractBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  window.selectTradeupItem = (item) => {
    if (selectedItems.length >= 5) {
      alert('Đã chọn đủ 5 món cho hợp đồng!');
      return;
    }
    // Check if same rarity as first item
    if (selectedItems.length > 0 && selectedItems[0].rarity !== item.rarity) {
      alert(`Chỉ được chọn các món cùng độ hiếm (${selectedItems[0].rarity.toUpperCase()})!`);
      return;
    }
    selectedItems.push(item);
    updateSlotsUI();
  };

  window.removeTradeupItem = (index) => {
    selectedItems.splice(index, 1);
    updateSlotsUI();
  };

  if (signContractBtn) {
    signContractBtn.addEventListener('click', async () => {
      if (selectedItems.length !== 5) return;

      signContractBtn.disabled = true;
      signContractBtn.innerText = 'ĐANG KÝ HỢP ĐỒNG...';

      try {
        const res = await fetch('/api/trade-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_ids: selectedItems.map(i => i.id) })
        });
        const data = await res.json();

        if (data.success && data.output_item) {
          if (window.csgoAudio) {
            window.csgoAudio.playWinReveal(data.output_item.rarity);
          }
          // Show result modal
          document.getElementById('tu-result-image').innerText = data.output_item.image;
          document.getElementById('tu-result-name').innerText = data.output_item.name;
          document.getElementById('tu-result-rarity').innerText = data.output_item.rarity_name;
          document.getElementById('tu-result-rarity').style.color = data.output_item.color;
          document.getElementById('tu-result-price').innerText = data.output_item.price_range;
          document.getElementById('tu-result-desc').innerText = data.output_item.description;

          resultModal.classList.remove('hidden');
          resultModal.classList.add('flex');

          // Reset selection
          selectedItems = [];
          updateSlotsUI();
        } else {
          alert(data.message || 'Hợp đồng thất bại!');
        }
      } catch (err) {
        alert('Lỗi: ' + err.message);
      } finally {
        signContractBtn.innerText = '✍️ KÝ HỢP ĐỒNG NÂNG CẤP (TRADE-UP)';
        signContractBtn.disabled = false;
      }
    });
  }
}
