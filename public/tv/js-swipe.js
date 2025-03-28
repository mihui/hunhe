class SwipeHandler {
  /** @type {HTMLElement} */
  domElement;
  /** @type {number} */
  startX;
  /** @type {number} */
  threshold;
  /** @type {number} */
  lastMoveTimestamp;
  /** @type {number} */
  debounceTime;
  /**
   * Constructor
   * @param {HTMLElement} dom HTML element
   */
  constructor(dom) {
    this.domElement = dom;
    this.startX = 0;
    this.threshold = 40; // Minimum distance to consider a swipe
    this.lastMoveTimestamp = 0;
    this.debounceTime = 500; // Debounce time in ms (60fps)
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
  }

  onTouchStart(evt) {
    try {
      if (evt.touches.length === 0) {
        console.error('No touch detected');
        return;
      }
      this.startX = evt.touches[0].clientX;
    } catch (error) {}
  }

  onTouchMove(evt) {
    try {
      if (evt.touches.length === 0) { return; }
      const currentTimestamp = window.performance.now();

      const currentX = evt.touches[0].clientX;
      const diffX = this.startX - currentX;

      if (currentTimestamp - this.lastMoveTimestamp < this.debounceTime) {
        return;
      }
      console.log('debounceTime:', currentTimestamp - this.lastMoveTimestamp, 'threshold:', Math.abs(diffX).toFixed(2));

      this.lastMoveTimestamp = currentTimestamp;
      if (Math.abs(diffX) >= this.threshold) {
        requestAnimationFrame(() => {
          const eventName = diffX > 0 ? 'swipeLeft' : 'swipeRight';
          this.trigger(eventName);
          this.startX = currentX;
        });
      }
    } catch (error) {}
  }

  on(eventName, callback) {
    if (!eventName || typeof eventName !== 'string') {
      console.error('Invalid event name');
      return;
    }
    this.domElement.addEventListener(eventName, callback);
  }
  
  off(eventName, callback) {
    if (!eventName || typeof eventName !== 'string') {
      console.error('Invalid event name');
      return;
    }
    this.domElement.removeEventListener(eventName, callback);
  }

  trigger(eventName) {
    const event = new Event(eventName, { bubbles: true });
    this.domElement.dispatchEvent(event);
  }
}

window.swipe = (domElement) => {
  return new SwipeHandler(domElement);
};
