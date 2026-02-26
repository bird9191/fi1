import { ref, readonly } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration: number
}

const notifications = ref<Notification[]>([])

export function useNotifications() {
  function show(
    message: string, 
    type: NotificationType = 'info', 
    duration: number = 4000
  ) {
    const id = Math.random().toString(36).substring(2, 9)
    
    const notification: Notification = {
      id,
      type,
      message,
      duration
    }

    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function success(message: string, duration?: number) {
    return show(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    return show(message, 'error', duration)
  }

  function warning(message: string, duration?: number) {
    return show(message, 'warning', duration)
  }

  function info(message: string, duration?: number) {
    return show(message, 'info', duration)
  }

  function remove(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clear() {
    notifications.value = []
  }

  return {
    notifications: readonly(notifications),
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  }
}
