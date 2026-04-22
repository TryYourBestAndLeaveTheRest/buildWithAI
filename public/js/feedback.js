/**
 * Frontend-only feedback modal behavior.
 * - Open modal
 * - "No" closes modal
 * - "Yes" redirects to Google Form
 */

(function initFeedbackModal() {
  const formUrl = document
    .querySelector('meta[name="feedback-form-url"]')
    ?.getAttribute('content') ||
    'https://docs.google.com/forms/d/e/1FAIpQLSfHSOH0zBS5y0x7TNN6zHeGjFqEmVzWAL4hlT7p1JGfLPK4tg/viewform?usp=header';

  const modal = document.getElementById('feedbackModal');
  const openBtn = document.getElementById('floatingFeedbackBtn');
  const yesBtn = document.getElementById('feedbackYesBtn');
  const noBtn = document.getElementById('feedbackNoBtn');
  const closeBtn = document.querySelector('.feedback-modal-close');
  const overlay = document.querySelector('.feedback-modal-overlay');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('show');
  };

  const closeModal = () => {
    modal.classList.remove('show');
  };

  openBtn && openBtn.addEventListener('click', openModal);
  noBtn && noBtn.addEventListener('click', closeModal);
  closeBtn && closeBtn.addEventListener('click', closeModal);
  overlay && overlay.addEventListener('click', closeModal);

  yesBtn && yesBtn.addEventListener('click', () => {
    closeModal();
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  });
})();
