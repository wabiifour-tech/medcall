import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MedCall database...\n')

  // Create Host user
  const hostPassword = await hash('password123', 12)
  const host = await prisma.user.upsert({
    where: { matricNumber: 'HOST001' },
    update: {},
    create: {
      name: 'Dr. John Smith',
      email: 'host001@medcall.local',
      matricNumber: 'HOST001',
      passwordHash: hostPassword,
      role: 'HOST',
      profileLocked: true,
    },
  })
  console.log('✅ Host created:', host.name, `(${host.matricNumber})`)

  // Create Student users
  const studentPassword = await hash('password123', 12)
  const students = [
    { name: 'Alice Johnson', matric: 'CSC/2020/001' },
    { name: 'Bob Williams', matric: 'CSC/2020/002' },
    { name: 'Carol Davis', matric: 'CSC/2020/003' },
    { name: 'David Brown', matric: 'CSC/2020/004' },
    { name: 'Eve Miller', matric: 'CSC/2020/005' },
  ]

  for (const student of students) {
    const created = await prisma.user.upsert({
      where: { matricNumber: student.matric },
      update: {},
      create: {
        name: student.name,
        email: `${student.matric.toLowerCase().replace(/\//g, '')}@medcall.local`,
        matricNumber: student.matric,
        passwordHash: studentPassword,
        role: 'STUDENT',
        profileLocked: true,
      },
    })
    console.log('✅ Student created:', created.name, `(${created.matricNumber})`)
  }

  // Create sample meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: 'CSC 301 - Data Structures Lecture',
      description: 'Introduction to Trees and Graphs',
      hostId: host.id,
      meetingCode: 'CSC30124',
      status: 'LIVE',
      allowAttendance: true,
    },
  })
  console.log('\n✅ Sample meeting created:')
  console.log(`   Title: ${meeting.title}`)
  console.log(`   Code: ${meeting.meetingCode}`)

  console.log('\n' + '='.repeat(50))
  console.log('📋 TEST CREDENTIALS')
  console.log('='.repeat(50))
  console.log('\n🔵 HOST LOGIN:')
  console.log('   Matric Number: HOST001')
  console.log('   Password: password123')
  console.log('\n🟢 STUDENT LOGIN:')
  console.log('   Matric Number: CSC/2020/001')
  console.log('   Password: password123')
  console.log('\n📺 SAMPLE MEETING CODE: CSC30124')
  console.log('='.repeat(50))
  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
