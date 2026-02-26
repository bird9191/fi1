import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.currentUser)
  const role = computed(() => authStore.currentUser?.role)
  const isTeacher = computed(() => authStore.isTeacher)
  const isAdmin = computed(() => authStore.isAdmin)

  async function login(email: string, password: string, twoFactorCode?: string) {
    return await authStore.login(email, password, twoFactorCode)
  }

  async function register(name: string, email: string, password: string, role: string) {
    return await authStore.register(name, email, password, role)
  }

  function logout() {
    authStore.logout()
    router.push('/login')
  }

  function requireAuth(): boolean {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  function requireTeacher(): boolean {
    if (!isTeacher.value) {
      router.push('/dashboard')
      return false
    }
    return true
  }

  function requireAdmin(): boolean {
    if (!isAdmin.value) {
      router.push('/dashboard')
      return false
    }
    return true
  }

  return {
    isAuthenticated,
    user,
    role,
    isTeacher,
    isAdmin,
    login,
    register,
    logout,
    requireAuth,
    requireTeacher,
    requireAdmin
  }
}
