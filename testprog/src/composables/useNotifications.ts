/**
 * ==========================================
 * ХУК УВЕДОМЛЕНИЙ (useNotifications.ts)
 * ==========================================
 * 
 * Composable для работы с toast-уведомлениями
 */

import { ref, readonly } from 'vue'

/**
 * Тип уведомления
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * Объект уведомления
 */
export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration: number
}

// ==========================================
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ==========================================

/** Список активных уведомлений */
const notifications = ref<Notification[]>([])

/**
 * Хук для работы с уведомлениями
 */
export function useNotifications() {
  // ==========================================
  // МЕТОДЫ
  // ==========================================

  /**
   * Показывает уведомление
   */
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

    // Автоматическое удаление
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  /**
   * Показывает уведомление об успехе
   */
  function success(message: string, duration?: number) {
    return show(message, 'success', duration)
  }

  /**
   * Показывает уведомление об ошибке
   */
  function error(message: string, duration?: number) {
    return show(message, 'error', duration)
  }

  /**
   * Показывает предупреждение
   */
  function warning(message: string, duration?: number) {
    return show(message, 'warning', duration)
  }

  /**
   * Показывает информационное уведомление
   */
  function info(message: string, duration?: number) {
    return show(message, 'info', duration)
  }

  /**
   * Удаляет уведомление по ID
   */
  function remove(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Удаляет все уведомления
   */
  function clear() {
    notifications.value = []
  }

  return {
    // Состояние (только для чтения)
    notifications: readonly(notifications),

    // Методы
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  }
}


