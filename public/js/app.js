// Tab switching logic
function switchTab(tab) {
    const haveList = document.getElementById('have-list');
    const needList = document.getElementById('need-list');
    const haveBtn = document.getElementById('have-btn');
    const needBtn = document.getElementById('need-btn');

    if (tab === 'have') {
        if (haveList) haveList.classList.remove('hidden');
        if (needList) needList.classList.add('hidden');
        if (haveBtn) {
            haveBtn.classList.add('border-cyan-500', 'text-cyan-400');
            haveBtn.classList.remove('border-transparent', 'text-slate-400');
        }
        if (needBtn) {
            needBtn.classList.remove('border-cyan-500', 'text-cyan-400');
            needBtn.classList.add('border-transparent', 'text-slate-400');
        }
    } else {
        if (haveList) haveList.classList.add('hidden');
        if (needList) needList.classList.remove('hidden');
        if (needBtn) {
            needBtn.classList.add('border-cyan-500', 'text-cyan-400');
            needBtn.classList.remove('border-transparent', 'text-slate-400');
        }
        if (haveBtn) {
            haveBtn.classList.remove('border-cyan-500', 'text-cyan-400');
            haveBtn.classList.add('border-transparent', 'text-slate-400');
        }
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const haveBtn = document.getElementById('have-btn');
    const needBtn = document.getElementById('need-btn');

    if (haveBtn) {
        haveBtn.addEventListener('click', () => switchTab('have'));
    }
    if (needBtn) {
        needBtn.addEventListener('click', () => switchTab('need'));
    }
});
