/**
 * Feedback Modal Manager
 * Handles:
 * - Exit intent detection
 * - Timed feedback triggers
 * - Modal display/dismiss logic
 * - Session storage to prevent repeated shows
 */

const FeedbackModal = (() => {
  const configuredFormUrl = document
    .querySelector('meta[name="feedback-form-url"]')
    ?.getAttribute('content');

  // Configuration - can be set via window.FEEDBACK_CONFIG or defaults
  const CONFIG = {
    GOOGLE_FORM_URL: configuredFormUrl ||
                     'https://docs.google.com/forms/d/e/1FAIpQLSfHSOH0zBS5y0x7TNN6zHeGjFqEmVzWAL4hlT7p1JGfLPK4tg/viewform?usp=header',
    TIMER_DELAY: 120000, // 2 minutes in ms
    SESSION_KEY: 'feedbackModalShown',
  };

  // State
  let state = {
    modalShown: false,
    timerStarted: false,
    timerTimeout: null,
    activeModalSource: 'floating-button',
  };

  /**
   * Check if modal has been shown in this session
   */
  const hasModalBeenShown = () => {
    return sessionStorage.getItem(CONFIG.SESSION_KEY) === 'true';
  };

  
  /**
   * Mark modal as shown in this session
   */
  const markModalAsShown = () => {
    sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
    state.modalShown = true;
  };

  /**
   * Get the modal element
   */
  const getModal = () => {
    return document.getElementById('feedbackModal');
  };

  /**
   * Show the feedback modal with animation
   */
  const showModal = (source = 'floating-button') => {
    if (state.modalShown || hasModalBeenShown()) {
      return;
    }

    const modal = getModal();
    if (!modal) return;

    state.activeModalSource = source;
    modal.classList.add('show');
    markModalAsShown();
  };

  /**
   * Hide/dismiss the feedback modal
   */
  const hideModal = () => {
    const modal = getModal();
    if (!modal) return;

    modal.classList.remove('show');
  };

  /**
   * Log feedback action to backend
   */
  const logFeedbackAction = async (source, action) => {
    try {
      await fetch('/api/feedback/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          action,
        }),
      });
    } catch (error) {
      console.error('[Feedback] Error logging action:', error);
    }
  };

  /**
   * Redirect to feedback form
   */
  const goToFeedbackForm = (source = 'floating-button') => {
    logFeedbackAction(source, 'redirected-to-form');
    window.open(CONFIG.GOOGLE_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  /**
   * Dismiss the modal
   */
  const dismissModal = (source = 'floating-button') => {
    logFeedbackAction(source, 'dismissed');
    hideModal();
  };

  /**
   * Setup event listeners for modal interaction
   */
  const setupEventListeners = () => {
    // Close button
    const closeBtn = document.querySelector('.feedback-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dismissModal(state.activeModalSource));
    }

    // "Give Feedback" button
    const yesBtn = document.getElementById('feedbackYesBtn');
    if (yesBtn) {
      yesBtn.addEventListener('click', () => {
        hideModal();
        goToFeedbackForm(state.activeModalSource);
      });
    }

    // "No, Thanks" button
    const noBtn = document.getElementById('feedbackNoBtn');
    if (noBtn) {
      noBtn.addEventListener('click', () => dismissModal(state.activeModalSource));
    }

    // Floating button
    const floatingBtn = document.getElementById('floatingFeedbackBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', () => {
        goToFeedbackForm('floating-button');
      });
    }

    // Close modal on overlay click
    const overlay = document.querySelector('.feedback-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => dismissModal(state.activeModalSource));
    }
  };

  /**
   * Detect exit intent (mouse leaving the page)
   */
  const setupExitIntent = () => {
    document.addEventListener('mouseleave', (event) => {
      // Only trigger if mouse is leaving from the top (typical exit intent)
      if (event.clientY <= 0 && !hasModalBeenShown()) {
        showModal('exit-intent');
      }
    });
  };

  /**
   * Setup timer to show feedback after 2 minutes
   */
  const setupTimerTrigger = () => {
    if (state.timerStarted) return;
    state.timerStarted = true;

    state.timerTimeout = setTimeout(() => {
      if (!hasModalBeenShown()) {
        showModal('timed-trigger');
      }
    }, CONFIG.TIMER_DELAY);
  };

  /**
   * Cleanup timer on page unload
   */
  const cleanupTimer = () => {
    if (state.timerTimeout) {
      clearTimeout(state.timerTimeout);
      state.timerTimeout = null;
    }
  };

  /**
   * Initialize the feedback system
   */
  const init = () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  };

  const initialize = () => {
    // Check if modal exists
    const modal = getModal();
    if (!modal) {
      console.warn('[Feedback] Modal element not found in DOM');
      return;
    }

    // Setup all listeners and triggers
    setupEventListeners();
    setupExitIntent();
    setupTimerTrigger();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupTimer);
  };

  // Return public API
  return {
    init,
    show: showModal,
    hide: hideModal,
    dismiss: dismissModal,
    goToForm: goToFeedbackForm,
    logAction: logFeedbackAction,
  };
})();

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  FeedbackModal.init();
}
