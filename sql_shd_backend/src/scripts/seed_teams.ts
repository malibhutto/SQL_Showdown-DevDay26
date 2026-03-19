import mongoose from 'mongoose';
import { User } from '../models';
import { config } from '../config';

/**
 * Seed script to register all competition teams
 * Run with: npm run seed:teams
 */

interface TeamData {
  teamName: string;
  password: string;
  lab: string;
  members?: string[];
}

const teams: TeamData[] = [
  // LAB 5 Teams
  { teamName: 'Kwery', password: 'Kwery@2026', lab: 'LAB 5', members: ['Umer Ahmed Shaikh', 'Abdul Jibran', 'Qasim Ali'] },
  { teamName: 'Binary_Titans', password: 'Binary@2026', lab: 'LAB 5', members: ['Hassan Ali', 'Muhammad Haad', 'Hassnain Ali Shah'] },
  { teamName: 'Binary_Brains', password: 'Brains@2026', lab: 'LAB 5', members: ['Eshal Adnan', 'Umama Zubair', 'Aiman Farooqi'] },
  { teamName: 'Quantum_Coders', password: 'Quantum@2026', lab: 'LAB 5', members: ['Syed Saad Ali Shah', 'Muhammad Shafay Siddiqui'] },
  { teamName: 'YTN_squad', password: 'YTNsquad@2026', lab: 'LAB 5', members: ['Nimrita rani', 'Tahira sarwar', 'Yumna gul'] },
  { teamName: 'L3GACY', password: 'L3gacy@2026', lab: 'LAB 5', members: ['Muhammad Irfan', 'Huzaifa Imran', 'Umais Ahmed'] },
  { teamName: 'Lone_Wolf', password: 'LoneWolf@2026', lab: 'LAB 5', members: ['Salman Ahmed'] },
  { teamName: 'AKA', password: 'AKAteam@2026', lab: 'LAB 5', members: ['Muhammad Ali Imran'] },
  { teamName: 'Ibad', password: 'Ibadteam@2026', lab: 'LAB 5', members: ['Ibad Ur Rehman', 'Syed Okasha'] },
  { teamName: 'Data_Dynamos', password: 'DataDyn@2026', lab: 'LAB 5', members: ['Abdul Haseeb', 'Aayan Khan', 'Hunain Ahmed'] },
  { teamName: 'Tech_Wizards', password: 'TechWiz@2026', lab: 'LAB 5', members: ['Aisha Zulfiqar Rajput', 'Inaaya Khatri', 'Muhammad Huzaifa Memon'] },
  { teamName: 'DevAvengers', password: 'DevAveng@2026', lab: 'LAB 5', members: ['Fareeha Jawed', 'Wajeeha Batool', 'Anabiyah Ahmed'] },
  { teamName: 'SQL_Squad', password: 'SQLSquad@2026', lab: 'LAB 5', members: ['Marium Naz', 'Eman Anjum Faiz', 'Gohar Zehra'] },
  { teamName: 'Query_osity', password: 'Queryosity@2026', lab: 'LAB 5', members: ['Syed Muhammad Haider Zaidi', 'Mesum Abbas', 'Syed Muhammad Muzammil Zaidi'] },
  { teamName: 'Database_Architect', password: 'DBArch@2026', lab: 'LAB 5', members: ['Syed Muhammad Ashar Ali Rizvi', 'Abdul Mannan'] },
  { teamName: 'Hail_Hydra', password: 'HailHydra@2026', lab: 'LAB 5', members: ['Ahsan Ali Khan', 'Hamza Naeem', 'Mohammad Anas'] },
  { teamName: 'binaryKnights1', password: 'BinKnight1@2026', lab: 'LAB 5', members: ['Muhammad Nihal Sheikh', 'Saad Baseer Khan', 'Muhammad Amaan'] },
  { teamName: 'Dominators', password: 'Dominate@2026', lab: 'LAB 5', members: ['Abbas Fakkharudin', 'SYED MUBEEN HAIDER', 'Rahoul Kumar'] },
  
  // LAB 6 Teams
  { teamName: 'SELECTive_Chaos', password: 'SelectChaos@2026', lab: 'LAB 6', members: ['Mishal Fahim', 'Dua Sohail Motiwala', 'Manahil Zulfiqar'] },
  { teamName: 'Cache_Hit', password: 'CacheHit@2026', lab: 'LAB 6', members: ['Muhammad Mushahid Hussain', 'Muhammad Murtajiz'] },
  { teamName: 'QMts', password: 'QMtsteam@2026', lab: 'LAB 6', members: ['Muhammad Hanzala Jamil', 'Arham Rasheed', 'Huzaifa Altaf'] },
  { teamName: 'Code_Diggers', password: 'CodeDig@2026', lab: 'LAB 6', members: ['Hania Adnan Siddiqui', 'Manal Hussain', 'Mherah Fatima'] },
  { teamName: 'The_Dreamers', password: 'Dreamers@2026', lab: 'LAB 6', members: ['Zainab', 'Muhammad Shahmeer Latif'] },
  { teamName: 'Query_Crafter', password: 'QueryCraft@2026', lab: 'LAB 6', members: ['Hamza Niaz', 'Abdullah Khilji', 'Mirza Bilal Hussain'] },
  { teamName: 'Paradox', password: 'Paradox@2026', lab: 'LAB 6', members: ['Ali Kashif', 'Hammad Abdul Rahim', 'Ismail Silat'] },
  { teamName: 'Null_pointers', password: 'NullPtr@2026', lab: 'LAB 6', members: ['Rafia Ameen', 'Shaeem Imran', 'Abeeha Asif'] },
  { teamName: 'Aloo_biryani', password: 'AlooBir@2026', lab: 'LAB 6', members: ['Rafay ghouri', 'Abdurehman', 'Muhammad Ali Adeel'] },
  { teamName: 'Human_for_loop', password: 'HumanLoop@2026', lab: 'LAB 6', members: ['Muhammad Umer', 'Taha Faisal'] },
  { teamName: 'Bare_minimum', password: 'BareMin@2026', lab: 'LAB 6', members: ['Abdul Rafay Tariq', 'Ahmed Affan', 'Muhammad Hashir Siddiqui'] },
  { teamName: 'Fallout_Normalizers', password: 'Fallout@2026', lab: 'LAB 6', members: ['Syed Muhammad Rayyan', 'Muhammad Furqan Mohsin', 'Anas Iqbal'] },
  { teamName: 'Musafir', password: 'Musafir@2026', lab: 'LAB 6', members: ['Muhammad Omer', 'Danish Ahmed', 'Zeeshan Ayaz'] },
  { teamName: 'Bilal_Ahmed', password: 'BilalAhmed@2026', lab: 'LAB 6', members: ['Bilal Ahmed'] },
  { teamName: 'codonomists', password: 'Codonomists@2026', lab: 'LAB 6', members: ['Tehreem', 'Rabia', 'Raheen Zia'] },
  { teamName: 'Code_Warriors', password: 'CodeWar@2026', lab: 'LAB 6', members: ['Akhyar Ahmed Turk', 'Muhammad Obaid Majeed', 'Muhammad Uzzam Siddiqui'] },
  { teamName: 'AntiGPT', password: 'AntiGPT@2026', lab: 'LAB 6', members: ['Yahya Ali', 'Raed Ovais'] },
  { teamName: 'binaryKnights0', password: 'BinKnight0@2026', lab: 'LAB 6', members: ['Abdullah Farooq', 'Muhammad Fasih', 'Abdul Hayy Khan'] },
];

async function seedTeams() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB successfully');

    let registeredCount = 0;
    let skippedCount = 0;

    for (const team of teams) {
      try {
        // Check if team already exists
        const existingTeam = await User.findOne({ teamName: team.teamName });
        
        if (existingTeam) {
          console.log(`⏭️  Team "${team.teamName}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new team
        const newTeam = new User({
          teamName: team.teamName,
          passwordHash: team.password, // Will be hashed by the model pre-save hook
          createdAt: new Date(),
          lastLogin: null,
          isActive: true
        });

        await newTeam.save();
        console.log(`✅ Registered: ${team.teamName} (${team.lab}) - Password: ${team.password}`);
        registeredCount++;
      } catch (error: any) {
        console.error(`❌ Error registering team "${team.teamName}":`, error.message);
      }
    }

    console.log('\n================================');
    console.log('📊 Seed Summary:');
    console.log(`   Total teams: ${teams.length}`);
    console.log(`   ✅ Registered: ${registeredCount}`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`   LAB 5 teams: ${teams.filter(t => t.lab === 'LAB 5').length}`);
    console.log(`   LAB 6 teams: ${teams.filter(t => t.lab === 'LAB 6').length}`);
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedTeams();

// Export teams data for Excel generation
export { teams };
