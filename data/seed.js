const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../backend/models/User');
const Ticket = require('../backend/models/Ticket');
const Command = require('../backend/models/Command');
const Unit = require('../backend/models/Unit');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample data
const commands = [
  { name: 'פקמ"ז', description: 'פיקוד המחוז' },
  { name: 'פקע"א', description: 'פיקוד עורף אזרחי' },
  { name: 'צה"ל', description: 'צבא הגנה לישראל' },
  { name: 'משטרה', description: 'משטרת ישראל' },
  { name: 'כב"ה', description: 'כבאות והצלה' }
];

const units = [
  // פקמ"ז units
  { name: 'מרפ"א 8282', commandName: 'פקמ"ז', description: 'מרכז רפואי' },
  { name: 'יחש"ם 650 ג\'וליס', commandName: 'פקמ"ז', description: 'יחידת חשמל' },
  { name: 'יחזק"א 441', commandName: 'פקמ"ז', description: 'יחידת חזקה' },
  { name: 'בסי"ס 227', commandName: 'פקמ"ז', description: 'בסיס' },
  
  // פקע"א units  
  { name: 'מג"ד 331', commandName: 'פקע"א', description: 'מגד עורף' },
  { name: 'יחזק"ה 412', commandName: 'פקע"א', description: 'יחידת חזקה' },
  { name: 'בסי"ס 178', commandName: 'פקע"א', description: 'בסיס עורף' },
  
  // צה"ל units
  { name: 'חטיבת גולני', commandName: 'צה"ל', description: 'חטיבת חי"ר' },
  { name: 'חטיבת צנחנים', commandName: 'צה"ל', description: 'חטיבת צנחנים' },
  { name: 'יחידה 8200', commandName: 'צה"ל', description: 'יחידת מודיעין' },
  
  // משטרה units
  { name: 'תחנת ירושלים', commandName: 'משטרה', description: 'תחנת משטרה' },
  { name: 'תחנת תל אביב', commandName: 'משטרה', description: 'תחנת משטרה' },
  { name: 'מג"ב', commandName: 'משטרה', description: 'משמר הגבול' },
  
  // כב"ה units
  { name: 'תחנה מרכז', commandName: 'כב"ה', description: 'תחנת כיבוי' },
  { name: 'תחנה צפון', commandName: 'כב"ה', description: 'תחנת כיבוי' },
  { name: 'יחידת הצלה', commandName: 'כב"ה', description: 'יחידת הצלה מיוחדת' }
];

const users = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    command: 'פקמ"ז',
    unit: 'מרפ"א 8282'
  },
  {
    username: 'technician1',
    password: 'tech123',
    role: 'technician',
    command: 'פקמ"ז',
    unit: 'יחש"ם 650 ג\'וליס'
  },
  {
    username: 'technician2',
    password: 'tech123',
    role: 'technician',
    command: 'פקע"א',
    unit: 'מג"ד 331'
  },
  {
    username: 'viewer1',
    password: 'view123',
    role: 'viewer',
    command: 'צה"ל',
    unit: 'חטיבת גולני'
  }
];

const sampleTickets = [
  {
    ticketNumber: 5335,
    command: 'פקמ"ז',
    unit: 'מרפ"א 8282',
    priority: 'דחופה',
    status: 'בטיפול',
    isRecurring: false,
    description: 'תקלה במערכת המיזוג במבנה A - הטמפרטורה עולה מעל 30 מעלות',
    openDate: new Date('2025-01-15T08:30:00'),
    createdBy: 'technician1',
    assignedTechnician: 'technician1'
  },
  {
    ticketNumber: 5334,
    command: 'פקמ"ז',
    unit: 'יחש"ם 650 ג\'וליס',
    priority: 'מבצעית',
    status: 'פתוח',
    isRecurring: true,
    description: 'הפסקת חשמל חוזרת בקו הראשי - נדרשת בדיקה מיידית של הטרנספורמטור',
    openDate: new Date('2025-01-14T14:15:00'),
    createdBy: 'technician1'
  },
  {
    ticketNumber: 5333,
    command: 'פקע"א',
    unit: 'מג"ד 331',
    priority: 'רגילה',
    status: 'תוקן',
    isRecurring: false,
    description: 'החלפת נורות שרופות במסדרון הראשי',
    openDate: new Date('2025-01-13T11:20:00'),
    closeDate: new Date('2025-01-13T15:45:00'),
    createdBy: 'technician2',
    assignedTechnician: 'technician2'
  },
  {
    ticketNumber: 5332,
    command: 'צה"ל',
    unit: 'חטיבת גולני',
    priority: 'דחופה',
    status: 'בטיפול',
    isRecurring: false,
    description: 'תקלה במערכת הקשר - אין קשר עם העמדות החיצוניות',
    openDate: new Date('2025-01-12T09:00:00'),
    createdBy: 'admin',
    assignedTechnician: 'technician1',
    comments: [
      {
        author: 'technician1',
        content: 'בדקתי את הציוד - נראה שהבעיה באנטנה הראשית',
        createdAt: new Date('2025-01-12T10:30:00')
      }
    ]
  },
  {
    ticketNumber: 5331,
    command: 'משטרה',
    unit: 'תחנת ירושלים',
    priority: 'רגילה',
    status: 'תוקן',
    isRecurring: false,
    description: 'תיקון דלת כניסה ראשית - הצירים רופפים',
    openDate: new Date('2025-01-11T16:30:00'),
    closeDate: new Date('2025-01-11T18:00:00'),
    createdBy: 'admin'
  }
];

// Seed functions
async function seedCommands() {
  try {
    await Command.deleteMany({});
    console.log('Cleared existing commands');
    
    const createdCommands = await Command.insertMany(commands);
    console.log(`Created ${createdCommands.length} commands`);
    
    return createdCommands;
  } catch (error) {
    console.error('Error seeding commands:', error);
  }
}

async function seedUnits(createdCommands) {
  try {
    await Unit.deleteMany({});
    console.log('Cleared existing units');
    
    const unitsWithIds = units.map(unit => {
      const command = createdCommands.find(c => c.name === unit.commandName);
      return {
        ...unit,
        commandId: command._id
      };
    });
    
    const createdUnits = await Unit.insertMany(unitsWithIds);
    console.log(`Created ${createdUnits.length} units`);
    
    return createdUnits;
  } catch (error) {
    console.error('Error seeding units:', error);
  }
}

async function seedUsers() {
  try {
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

async function seedTickets() {
  try {
    await Ticket.deleteMany({});
    console.log('Cleared existing tickets');
    
    const createdTickets = await Ticket.insertMany(sampleTickets);
    console.log(`Created ${createdTickets.length} tickets`);
    
    return createdTickets;
  } catch (error) {
    console.error('Error seeding tickets:', error);
  }
}

// Generate additional random tickets
async function generateAdditionalTickets(count = 100) {
  try {
    const priorities = ['רגילה', 'דחופה', 'מבצעית'];
    const statuses = ['פתוח', 'בטיפול', 'תוקן'];
    const commandUnits = [
      { command: 'פקמ"ז', units: ['מרפ"א 8282', 'יחש"ם 650 ג\'וליס', 'יחזק"א 441', 'בסי"ס 227'] },
      { command: 'פקע"א', units: ['מג"ד 331', 'יחזק"ה 412', 'בסי"ס 178'] },
      { command: 'צה"ל', units: ['חטיבת גולני', 'חטיבת צנחנים', 'יחידה 8200'] },
      { command: 'משטרה', units: ['תחנת ירושלים', 'תחנת תל אביב', 'מג"ב'] },
      { command: 'כב"ה', units: ['תחנה מרכז', 'תחנה צפון', 'יחידת הצלה'] }
    ];
    
    const descriptions = [
      'תקלה במערכת המיזוג - נדרשת בדיקה דחופה',
      'הפסקת חשמל בקו הראשי',
      'תיקון דלתות וחלונות',
      'תקלה במערכת הקשר',
      'בעיית אינטרנט ורשת',
      'תחזוקת מערכות אבטחה',
      'תיקון מערכת השקייה',
      'בדיקת גנרטורים',
      'תחזוקת מעליות',
      'תיקון מערכת הסינון',
      'החלפת נורות LED',
      'תיקון מערכת הכביסה',
      'בדיקת מערכת כיבוי אש',
      'תחזוקת מערכת החימום',
      'תיקון צינורות מים'
    ];
    
    const additionalTickets = [];
    let ticketNumber = 5336;
    
    for (let i = 0; i < count; i++) {
      const commandUnit = commandUnits[Math.floor(Math.random() * commandUnits.length)];
      const unit = commandUnit.units[Math.floor(Math.random() * commandUnit.units.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      const openDate = new Date();
      openDate.setDate(openDate.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days
      
      const ticket = {
        ticketNumber: ticketNumber++,
        command: commandUnit.command,
        unit: unit,
        priority: priority,
        status: status,
        isRecurring: Math.random() < 0.2, // 20% chance of being recurring
        description: description,
        openDate: openDate,
        createdBy: users[Math.floor(Math.random() * users.length)].username
      };
      
      if (status === 'תוקן') {
        const closeDate = new Date(openDate);
        closeDate.setHours(closeDate.getHours() + Math.floor(Math.random() * 48)); // Close within 48 hours
        ticket.closeDate = closeDate;
      }
      
      if (status === 'בטיפול' || Math.random() < 0.3) {
        ticket.assignedTechnician = 'technician' + (Math.floor(Math.random() * 2) + 1);
      }
      
      additionalTickets.push(ticket);
    }
    
    const createdTickets = await Ticket.insertMany(additionalTickets);
    console.log(`Generated ${createdTickets.length} additional tickets`);
    
    return createdTickets;
  } catch (error) {
    console.error('Error generating additional tickets:', error);
  }
}

// Main seed function
async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    const createdCommands = await seedCommands();
    const createdUnits = await seedUnits(createdCommands);
    const createdUsers = await seedUsers();
    const createdTickets = await seedTickets();
    
    // Generate additional random tickets
    await generateAdditionalTickets(200);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`Commands: ${createdCommands.length}`);
    console.log(`Units: ${createdUnits.length}`);
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Tickets: ${createdTickets.length + 200} (including generated ones)`);
    
    console.log('\n👤 Default users created:');
    console.log('Admin: admin / admin123');
    console.log('Technician 1: technician1 / tech123');
    console.log('Technician 2: technician2 / tech123');
    console.log('Viewer: viewer1 / view123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
