
export const NotificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') return true;

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  send: (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico', // Fallback to favicon
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
};
