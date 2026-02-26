import type { User, Test, TestResult, UserAnswer, QuestionStat } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

interface AuthResponse {
  user: User
  token: string
}

interface TestsResponse {
  tests: Test[]
}

interface ResultsResponse {
  results: TestResult[]
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Ошибка сервера' }
      }

      return { data }
    } catch (error) {
      console.error('API Error:', error)
      return { error: 'Ошибка сети. Проверьте подключение.' }
    }
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, name: string, role: string) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me')
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async updateProfile(data: { name?: string; email?: string; phone?: string }) {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateAvatar(avatar: string | null) {
    return this.request<{ user: User }>('/users/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    })
  }

  async deleteAccount() {
    return this.request<{ message: string }>('/users/account', {
      method: 'DELETE',
    })
  }

  async getTests(params?: { search?: string; category?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.category) searchParams.set('category', params.category)
    const query = searchParams.toString()
    return this.request<TestsResponse>(`/tests${query ? `?${query}` : ''}`)
  }

  async getMyTests() {
    return this.request<TestsResponse>('/tests/my')
  }

  async getTest(id: string) {
    return this.request<{ test: Test }>(`/tests/${id}`)
  }

  async createTest(testData: Partial<Test>) {
    return this.request<{ test: Test }>('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    })
  }

  async updateTest(id: string, testData: Partial<Test>) {
    return this.request<{ test: Test }>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    })
  }

  async deleteTest(id: string) {
    return this.request<{ message: string }>(`/tests/${id}`, {
      method: 'DELETE',
    })
  }

  async submitTest(
    testId: string,
    data: {
      answers: UserAnswer[]
      mode: string
      totalTime: number
      questionStats: QuestionStat[]
    }
  ) {
    return this.request<{ result: TestResult }>(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMyResults() {
    return this.request<ResultsResponse>('/tests/results/my')
  }

  async getTestResults(testId: string) {
    return this.request<ResultsResponse>(`/tests/${testId}/results`)
  }

  async getCategories() {
    return this.request<{
      categories: Array<{ id: string; name: string; color: string }>
    }>('/categories')
  }

  async getNotifications() {
    return this.request<{
      notifications: Array<{
        id: string
        type: string
        title: string
        message: string
        isRead: boolean
        createdAt: string
      }>
    }>('/notifications')
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async resendVerification() {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    })
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  async getAdminStats() {
    const res = await this.request<{
      totalUsers: number
      totalTests: number
      totalResults: number
      activeToday: number
      totalQuestions?: number
    }>('/admin/stats')

    if (res.error) throw new Error(res.error)
    return res.data!
  }

  async getAdminUsers() {
    const res = await this.request<{
      users: Array<{
        id: string
        name: string
        email: string
        role: string
        createdAt: string
      }>
    }>('/admin/users')

    if (res.error) throw new Error(res.error)
    return res.data!.users
  }

  async updateUserRole(userId: string, role: string) {
    const res = await this.request<{ message: string }>(
      `/admin/users/${userId}/role`,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }
    )

    if (res.error) throw new Error(res.error)
    return res.data
  }

  async deleteUserAdmin(userId: string) {
    const res = await this.request<{ message: string }>(
      `/admin/users/${userId}`,
      { method: 'DELETE' }
    )

    if (res.error) throw new Error(res.error)
    return res.data
  }

  async broadcastNotification(title: string, message: string, type: string) {
    const res = await this.request<{ message: string }>(
      '/admin/notifications/broadcast',
      {
        method: 'POST',
        body: JSON.stringify({ title, message, type }),
      }
    )

    if (res.error) throw new Error(res.error)
    return res.data
  }
}

export const api = new ApiService()
