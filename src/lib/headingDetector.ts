export interface HeadingData {
  heading: number;
  accuracy?: number;
}

export type HeadingCallback = (data: HeadingData) => void;

/**
 * Get device heading using compass (magnetometer)
 */
export class HeadingDetector {
  private callback: HeadingCallback | null = null;
  private isListening = false;

  /**
   * Check if compass is available
   */
  static isSupported(): boolean {
    return 'DeviceOrientationEvent' in window && 'ondeviceorientationabsolute' in window;
  }

  /**
   * Request permission for iOS 13+ devices
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Permission request failed:', error);
        return false;
      }
    }
    return true; // Permission not needed on Android/other devices
  }

  /**
   * Start listening to compass heading
   */
  startListening(callback: HeadingCallback): void {
    this.callback = callback;
    this.isListening = true;

    const handleOrientation = (event: Event) => {
      if (!this.isListening || !this.callback) return;

      const orientationEvent = event as DeviceOrientationEvent;
      let heading: number | null = null;

      // Use webkitCompassHeading for iOS
      if ('webkitCompassHeading' in orientationEvent && typeof (orientationEvent as any).webkitCompassHeading === 'number') {
        heading = (orientationEvent as any).webkitCompassHeading;
      }
      // Use alpha for Android
      else if (orientationEvent.alpha !== null) {
        heading = 360 - orientationEvent.alpha;
      }

      if (heading !== null) {
        this.callback({
          heading: heading,
          accuracy: orientationEvent.absolute ? 5 : 15, // Estimated accuracy
        });
      }
    };

    // Try to use absolute orientation first (more accurate)
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  /**
   * Stop listening to compass
   */
  stopListening(): void {
    this.isListening = false;
    this.callback = null;
    
    // Remove both event listeners
    const dummyHandler = () => {};
    window.removeEventListener('deviceorientationabsolute', dummyHandler, true);
    window.removeEventListener('deviceorientation', dummyHandler, true);
  }
}

/**
 * Get single heading reading (promise-based)
 */
export function getHeading(timeout = 5000): Promise<HeadingData> {
  return new Promise((resolve, reject) => {
    const detector = new HeadingDetector();
    
    const timer = setTimeout(() => {
      detector.stopListening();
      reject(new Error('Compass reading timeout'));
    }, timeout);

    detector.startListening((data) => {
      clearTimeout(timer);
      detector.stopListening();
      resolve(data);
    });
  });
}
