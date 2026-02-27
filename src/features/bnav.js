// ── BOTTOM NAVIGATION ──────────────────────────────────────────────────────────

// closeDrawer will be called from window context, so it's available globally
let closeDrawer = () => {}; // placeholder; will be set at runtime

function bnav(activeId) {
  // Clear all bnav-btn active states
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  // Clear More menu item active states
  document.querySelectorAll('.bnav-more-item').forEach(b => b.classList.remove('active'));

  const moreIds = ['bn-more-expenses', 'bn-more-reports', 'bn-more-breakdown'];
  if (moreIds.includes(activeId)) {
    // Highlight More button and the specific item
    const moreBtn = document.getElementById('bn-more');
    if (moreBtn) moreBtn.classList.add('active');
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  } else {
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  }
}

function toggleBnavMore(e) {
  e.stopPropagation();
  const popup = document.getElementById('bnavMorePopup');
  const backdrop = document.getElementById('bnavMoreBackdrop');
  const isOpen = popup.classList.toggle('open');
  popup.style.display = isOpen ? 'block' : 'none';
  backdrop.style.display = isOpen ? 'block' : 'none';
}

function closeBnavMore() {
  const popup = document.getElementById('bnavMorePopup');
  const backdrop = document.getElementById('bnavMoreBackdrop');
  popup.classList.remove('open');
  backdrop.classList.remove('open');
  popup.style.display = 'none';
  backdrop.style.display = 'none';
}

// Show bottom nav only on phones (≤600px)
function updateBnavVisibility() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  nav.style.display = window.innerWidth <= 600 ? 'grid' : 'none';
}
updateBnavVisibility();
window.addEventListener('resize', updateBnavVisibility);

// SWIPE-TO-DISMISS drawer (bottom sheet on portrait)
(function() {
  let startY = 0, currentY = 0, dragging = false;
  const drawer = document.getElementById('drawer');
  drawer.addEventListener('touchstart', e => {
    // only initiate swipe from the handle area (top 60px)
    if (e.touches[0].clientY - drawer.getBoundingClientRect().top > 60) return;
    startY = e.touches[0].clientY;
    dragging = true;
    drawer.style.transition = 'none';
  }, {passive: true});
  drawer.addEventListener('touchmove', e => {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - startY);
    drawer.style.transform = `translateY(${delta}px)`;
  }, {passive: true});
  drawer.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    drawer.style.transition = '';
    const delta = currentY - startY;
    if (delta > 120) { closeDrawer(); }
    else { drawer.style.transform = ''; }
  });
})();


// INIT
document.getElementById('currentDate').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'});

export { bnav, toggleBnavMore, closeBnavMore, updateBnavVisibility };
