import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash('123456', salt)
  const adminPassword = await bcrypt.hash('admin123', salt)

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@testmaster.com' },
    update: {},
    create: {
      email: 'admin@testmaster.com',
      password: adminPassword,
      name: 'Администратор',
      role: 'admin',
      isEmailVerified: true,
    },
  })

  // Demo teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      password: hashedPassword,
      name: 'Демо Учитель',
      role: 'teacher',
      isEmailVerified: true,
    },
  })

  // Demo student
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      password: hashedPassword,
      name: 'Демо Студент',
      role: 'student',
      isEmailVerified: true,
    },
  })

  console.log('✅ Users created:')
  console.log(`   Admin: admin@testmaster.com / admin123`)
  console.log(`   Teacher: teacher@test.com / 123456`)
  console.log(`   Student: student@test.com / 123456\n`)

  // ==================== КАТЕГОРИИ ====================
  
  const categories = [
    { name: 'Программирование', description: 'Тесты по программированию', color: '#3b82f6', icon: '💻' },
    { name: 'Математика', description: 'Математические тесты', color: '#8b5cf6', icon: '📐' },
    { name: 'История', description: 'Тесты по истории', color: '#f59e0b', icon: '📜' },
    { name: 'Языки', description: 'Тесты по иностранным языкам', color: '#10b981', icon: '🌍' },
    { name: 'Наука', description: 'Научные тесты', color: '#06b6d4', icon: '🔬' },
    { name: 'Общие знания', description: 'Тесты на общую эрудицию', color: '#ec4899', icon: '🧠' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  console.log(`✅ Categories created: ${categories.length}\n`)

  // ==================== ТЕСТЫ ====================
  
  const existingTests = await prisma.test.count()
  if (existingTests > 0) {
    console.log('ℹ️  Tests already exist, skipping...\n')
  } else {
    // JavaScript Test
    const jsCategory = await prisma.category.findUnique({ where: { name: 'Программирование' } })
    
    const jsTest = await prisma.test.create({
      data: {
        title: 'Основы JavaScript',
        description: 'Тест на знание основ JavaScript для начинающих разработчиков',
        visibility: 'public',
        timeLimit: 15,
        allowTrainingMode: true,
        authorId: teacher.id,
        categories: jsCategory ? {
          create: [{ categoryId: jsCategory.id }]
        } : undefined,
        questions: {
          create: [
            {
              text: 'Какой оператор используется для строгого сравнения в JavaScript?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              category: 'Операторы',
              hint: 'Этот оператор проверяет и значение, и тип данных',
              explanation: '=== проверяет равенство без приведения типов',
              order: 0,
              options: {
                create: [
                  { text: '==', isCorrect: false, order: 0 },
                  { text: '===', isCorrect: true, order: 1 },
                  { text: '!=', isCorrect: false, order: 2 },
                  { text: '=', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'Выберите все примитивные типы данных в JavaScript',
              type: 'multiple',
              points: 15,
              difficulty: 'medium',
              category: 'Типы данных',
              hint: 'Примитивы - это не объекты',
              order: 1,
              options: {
                create: [
                  { text: 'string', isCorrect: true, order: 0 },
                  { text: 'number', isCorrect: true, order: 1 },
                  { text: 'array', isCorrect: false, order: 2 },
                  { text: 'boolean', isCorrect: true, order: 3 },
                  { text: 'object', isCorrect: false, order: 4 },
                ]
              }
            },
            {
              text: 'Что выведет console.log(typeof null)?',
              type: 'single',
              points: 10,
              difficulty: 'hard',
              category: 'Типы данных',
              hint: 'Это известный баг в JavaScript',
              explanation: 'Это историческая ошибка в JavaScript',
              order: 2,
              options: {
                create: [
                  { text: 'null', isCorrect: false, order: 0 },
                  { text: 'undefined', isCorrect: false, order: 1 },
                  { text: 'object', isCorrect: true, order: 2 },
                  { text: 'number', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'Как объявить константу в JavaScript?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              category: 'Переменные',
              order: 3,
              options: {
                create: [
                  { text: 'var', isCorrect: false, order: 0 },
                  { text: 'let', isCorrect: false, order: 1 },
                  { text: 'const', isCorrect: true, order: 2 },
                  { text: 'constant', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'Какой метод добавляет элемент в конец массива?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              category: 'Массивы',
              order: 4,
              options: {
                create: [
                  { text: 'push()', isCorrect: true, order: 0 },
                  { text: 'pop()', isCorrect: false, order: 1 },
                  { text: 'shift()', isCorrect: false, order: 2 },
                  { text: 'unshift()', isCorrect: false, order: 3 },
                ]
              }
            }
          ]
        }
      }
    })

    // History Test
    const historyCategory = await prisma.category.findUnique({ where: { name: 'История' } })
    
    const historyTest = await prisma.test.create({
      data: {
        title: 'История России',
        description: 'Тест по истории России для 9 класса',
        visibility: 'public',
        timeLimit: null,
        allowTrainingMode: true,
        authorId: teacher.id,
        categories: historyCategory ? {
          create: [{ categoryId: historyCategory.id }]
        } : undefined,
        questions: {
          create: [
            {
              text: 'В каком году было Крещение Руси?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              category: 'Древняя Русь',
              hint: 'Это произошло при князе Владимире',
              order: 0,
              options: {
                create: [
                  { text: '988', isCorrect: true, order: 0 },
                  { text: '862', isCorrect: false, order: 1 },
                  { text: '1054', isCorrect: false, order: 2 },
                  { text: '1147', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'Кто был первым царём всея Руси?',
              type: 'single',
              points: 10,
              difficulty: 'medium',
              category: 'Царская Россия',
              order: 1,
              options: {
                create: [
                  { text: 'Пётр I', isCorrect: false, order: 0 },
                  { text: 'Иван IV Грозный', isCorrect: true, order: 1 },
                  { text: 'Иван III', isCorrect: false, order: 2 },
                  { text: 'Борис Годунов', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'В каком году началась Великая Отечественная война?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              category: 'XX век',
              order: 2,
              options: {
                create: [
                  { text: '1939', isCorrect: false, order: 0 },
                  { text: '1941', isCorrect: true, order: 1 },
                  { text: '1940', isCorrect: false, order: 2 },
                  { text: '1942', isCorrect: false, order: 3 },
                ]
              }
            }
          ]
        }
      }
    })

    // Math Test
    const mathCategory = await prisma.category.findUnique({ where: { name: 'Математика' } })
    
    const mathTest = await prisma.test.create({
      data: {
        title: 'Базовая математика',
        description: 'Тест на базовые математические знания',
        visibility: 'public',
        timeLimit: 10,
        allowTrainingMode: true,
        authorId: teacher.id,
        categories: mathCategory ? {
          create: [{ categoryId: mathCategory.id }]
        } : undefined,
        questions: {
          create: [
            {
              text: 'Чему равен квадрат числа 9?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              order: 0,
              options: {
                create: [
                  { text: '18', isCorrect: false, order: 0 },
                  { text: '81', isCorrect: true, order: 1 },
                  { text: '72', isCorrect: false, order: 2 },
                  { text: '90', isCorrect: false, order: 3 },
                ]
              }
            },
            {
              text: 'Сколько сторон у пятиугольника?',
              type: 'single',
              points: 10,
              difficulty: 'easy',
              order: 1,
              options: {
                create: [
                  { text: '4', isCorrect: false, order: 0 },
                  { text: '5', isCorrect: true, order: 1 },
                  { text: '6', isCorrect: false, order: 2 },
                  { text: '7', isCorrect: false, order: 3 },
                ]
              }
            }
          ]
        }
      }
    })

    console.log(`✅ Tests created: 3`)
    console.log(`   - ${jsTest.title}`)
    console.log(`   - ${historyTest.title}`)
    console.log(`   - ${mathTest.title}\n`)
  }

  console.log('🎉 Database seeded successfully!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
