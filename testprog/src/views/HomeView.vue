

<template>
  <div class="home">

    <section class="hero">

      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">TestMaster</span>
        </h1>
        
        <p class="hero-subtitle">
          Создавайте и проходите тесты онлайн
        </p>
        
        <p class="hero-description">
          Платформа для учителей и студентов. Создавайте экзамены,
          делитесь тестами и отслеживайте результаты в реальном времени.
        </p>

        <div class="hero-actions" v-if="!authStore.isAuthenticated">
          <router-link to="/register" class="btn btn-primary btn-lg">
            Начать бесплатно
          </router-link>
          <router-link to="/login" class="btn btn-outline btn-lg">
            Войти
          </router-link>
        </div>
      </div>

      <div class="hero-visual">
        <div class="floating-card card-1">
          <span> Создание тестов</span>
        </div>
        <div class="floating-card card-2">
          <span> Прохождение</span>
        </div>
        <div class="floating-card card-3">
          <span> Результаты</span>
        </div>
      </div>
      
    </section>

    <section class="features">
      <h2 class="section-title">Возможности платформы</h2>

      <div class="features-grid">

        <div class="feature-card">
          <h3>‍ Для учителей</h3>
          <p>
            Создавайте тесты с разными типами вопросов, 
            устанавливайте лимит времени и контролируйте доступ
          </p>
        </div>

        <div class="feature-card">
          <h3>‍ Для студентов</h3>
          <p>
            Проходите тесты онлайн, получайте мгновенные 
            результаты и отслеживайте свой прогресс
          </p>
        </div>

        <div class="feature-card">
          <h3> Приватность</h3>
          <p>
            Создавайте приватные тесты доступные только 
            по приглашению или публичные для всех
          </p>
        </div>

        <div class="feature-card">
          <h3> Быстро и просто</h3>
          <p>
            Интуитивный интерфейс позволяет 
            создать тест за считанные минуты
          </p>
        </div>
        
      </div>
    </section>

    <section class="demo-credentials" v-if="!authStore.isAuthenticated">
      <div class="demo-card">
        <h3> Демо доступ</h3>
        <p>Попробуйте платформу с демо аккаунтами:</p>
        
        <div class="credentials">
          <div class="credential">
            <strong>Учитель:</strong> teacher@test.com / 123456
          </div>
          <div class="credential">
            <strong>Студент:</strong> student@test.com / 123456
          </div>
        </div>
      </div>
    </section>
    
  </div>
</template>

<script setup lang="ts">

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>

.home {
  min-height: 100vh;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4rem 2rem;
  min-height: 80vh;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 600px;
  z-index: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--color-text);
  margin-bottom: 1rem;
  font-weight: 500;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-visual {
  position: relative;
  width: 400px;
  height: 400px;
  z-index: 1;
}

.floating-card {
  position: absolute;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.card-2 {
  top: 45%;
  right: 5%;
  animation-delay: 2s;
}

.card-3 {
  bottom: 15%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.features {
  padding: 6rem 2rem;
  background: var(--color-background);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: var(--color-text);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.feature-card p {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.demo-credentials {
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
}

.demo-card {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem 3rem;
  text-align: center;
  max-width: 500px;
}

.demo-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.demo-card p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.credentials {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.credential {
  background: var(--color-background);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding: 3rem 1.5rem;
    min-height: auto;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    display: none;
  }

  .features {
    padding: 3rem 1rem;
  }

  .section-title {
    font-size: 1.75rem;
    margin-bottom: 2rem;
  }

  .features-grid {
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .demo-credentials {
    padding: 2rem 1rem;
  }

  .demo-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .btn {
    width: 100%;
    text-align: center;
  }

  .credential {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
