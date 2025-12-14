import nodemailer from 'nodemailer'

// Настройки для разных провайдеров
// Для продакшена замените на реальные данные SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
})

const APP_NAME = 'TestMaster'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

// Базовый HTML шаблон
function getBaseTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_NAME}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; font-size: 28px; font-weight: bold; color: #2563eb; }
        .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #1d4ed8; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f0f9ff; padding: 20px; border-radius: 8px; color: #2563eb; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        .warning { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
        h1 { color: #1f2937; margin: 0 0 20px 0; }
        p { margin: 0 0 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">${APP_NAME}</div>
          ${content}
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} ${APP_NAME}. Все права защищены.
          <br>Это автоматическое сообщение, не отвечайте на него.
        </div>
      </div>
    </body>
    </html>
  `
}

// Отправка письма для подтверждения email
export async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`
  
  const html = getBaseTemplate(`
    <h1>Добро пожаловать, ${name}!</h1>
    <p>Спасибо за регистрацию в ${APP_NAME}. Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="btn">Подтвердить Email</a>
    </div>
    <p>Или скопируйте эту ссылку в браузер:</p>
    <p style="word-break: break-all; font-size: 14px; color: #666;">${verifyUrl}</p>
    <div class="warning">
      ⚠️ Ссылка действительна 24 часа. Если вы не регистрировались на нашем сайте, проигнорируйте это письмо.
    </div>
  `)

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@testmaster.com'}>`,
      to: email,
      subject: `Подтверждение email - ${APP_NAME}`,
      html
    })
    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    // В dev режиме просто логируем ссылку
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 DEV MODE - Verification link: ${verifyUrl}\n`)
      return true
    }
    return false
  }
}

// Отправка письма для сброса пароля
export async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  
  const html = getBaseTemplate(`
    <h1>Сброс пароля</h1>
    <p>Здравствуйте, ${name}!</p>
    <p>Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Сбросить пароль</a>
    </div>
    <p>Или скопируйте эту ссылку в браузер:</p>
    <p style="word-break: break-all; font-size: 14px; color: #666;">${resetUrl}</p>
    <div class="warning">
      ⚠️ Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо или обратитесь в поддержку.
    </div>
  `)

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@testmaster.com'}>`,
      to: email,
      subject: `Сброс пароля - ${APP_NAME}`,
      html
    })
    console.log(`Password reset email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 DEV MODE - Password reset link: ${resetUrl}\n`)
      return true
    }
    return false
  }
}

// Отправка кода 2FA
export async function send2FACode(email, name, code) {
  const html = getBaseTemplate(`
    <h1>Код подтверждения</h1>
    <p>Здравствуйте, ${name}!</p>
    <p>Ваш код для входа в аккаунт:</p>
    <div class="code">${code}</div>
    <div class="warning">
      ⚠️ Код действителен 5 минут. Никому не сообщайте этот код.
    </div>
  `)

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@testmaster.com'}>`,
      to: email,
      subject: `Код подтверждения - ${APP_NAME}`,
      html
    })
    console.log(`2FA code sent to ${email}`)
    return true
  } catch (error) {
    console.error('Failed to send 2FA code:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 DEV MODE - 2FA Code: ${code}\n`)
      return true
    }
    return false
  }
}

// Уведомление о новом результате теста
export async function sendTestResultNotification(email, name, testTitle, score, percentage) {
  const html = getBaseTemplate(`
    <h1>Результат теста</h1>
    <p>Здравствуйте, ${name}!</p>
    <p>Вы прошли тест "<strong>${testTitle}</strong>"</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 48px; font-weight: bold; color: ${percentage >= 70 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'};">
        ${percentage}%
      </div>
      <div style="font-size: 18px; color: #666;">
        ${score} баллов
      </div>
    </div>
    <div style="text-align: center;">
      <a href="${APP_URL}/results" class="btn">Посмотреть детали</a>
    </div>
  `)

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@testmaster.com'}>`,
      to: email,
      subject: `Результат теста: ${testTitle} - ${APP_NAME}`,
      html
    })
    return true
  } catch (error) {
    console.error('Failed to send test result notification:', error)
    return false
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FACode,
  sendTestResultNotification
}




