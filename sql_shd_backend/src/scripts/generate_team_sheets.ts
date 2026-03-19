import ExcelJS from 'exceljs';
import path from 'path';

/**
 * Generate Excel sheets with team credentials
 * Run with: npx ts-node src/scripts/generate_team_sheets.ts
 */

interface TeamData {
  teamName: string;
  password: string;
  lab: string;
  members?: string[];
  institution?: string;
}

const teams: TeamData[] = [
  // LAB 5 Teams
  { teamName: 'Kwery', password: 'Kwery@2026', lab: 'LAB 5', members: ['Umer Ahmed Shaikh', 'Abdul Jibran', 'Qasim Ali'], institution: 'FAST NUCES' },
  { teamName: 'Binary_Titans', password: 'Binary@2026', lab: 'LAB 5', members: ['Hassan Ali', 'Muhammad Haad', 'Hassnain Ali Shah'], institution: 'Sukkur IBA' },
  { teamName: 'Binary_Brains', password: 'Brains@2026', lab: 'LAB 5', members: ['Eshal Adnan', 'Umama Zubair', 'Aiman Farooqi'], institution: 'FAST NUCES' },
  { teamName: 'Quantum_Coders', password: 'Quantum@2026', lab: 'LAB 5', members: ['Syed Saad Ali Shah', 'Muhammad Shafay Siddiqui'], institution: 'Iba Sukkur' },
  { teamName: 'YTN_squad', password: 'YTNsquad@2026', lab: 'LAB 5', members: ['Nimrita rani', 'Tahira sarwar', 'Yumna gul'], institution: 'Sukkur IBA University' },
  { teamName: 'L3GACY', password: 'L3gacy@2026', lab: 'LAB 5', members: ['Muhammad Irfan', 'Huzaifa Imran', 'Umais Ahmed'], institution: 'FAST NUCES' },
  { teamName: 'Lone_Wolf', password: 'LoneWolf@2026', lab: 'LAB 5', members: ['Salman Ahmed'], institution: 'NED University' },
  { teamName: 'AKA', password: 'AKAteam@2026', lab: 'LAB 5', members: ['Muhammad Ali Imran'], institution: 'KIET' },
  { teamName: 'Ibad', password: 'Ibadteam@2026', lab: 'LAB 5', members: ['Ibad Ur Rehman', 'Syed Okasha'], institution: 'FAST NUCES' },
  { teamName: 'Data_Dynamos', password: 'DataDyn@2026', lab: 'LAB 5', members: ['Abdul Haseeb', 'Aayan Khan', 'Hunain Ahmed'], institution: 'Bahria University' },
  { teamName: 'Tech_Wizards', password: 'TechWiz@2026', lab: 'LAB 5', members: ['Aisha Zulfiqar Rajput', 'Inaaya Khatri', 'Muhammad Huzaifa Memon'], institution: 'FAST NUCES' },
  { teamName: 'DevAvengers', password: 'DevAveng@2026', lab: 'LAB 5', members: ['Fareeha Jawed', 'Wajeeha Batool', 'Anabiyah Ahmed'], institution: 'UBIT University of Karachi' },
  { teamName: 'SQL_Squad', password: 'SQLSquad@2026', lab: 'LAB 5', members: ['Marium Naz', 'Eman Anjum Faiz', 'Gohar Zehra'], institution: 'NED University' },
  { teamName: 'Query_osity', password: 'Queryosity@2026', lab: 'LAB 5', members: ['Syed Muhammad Haider Zaidi', 'Mesum Abbas', 'Syed Muhammad Muzammil Zaidi'], institution: 'FAST NUCES' },
  { teamName: 'Database_Architect', password: 'DBArch@2026', lab: 'LAB 5', members: ['Syed Muhammad Ashar Ali Rizvi', 'Abdul Mannan'], institution: 'Bahria University' },
  { teamName: 'Hail_Hydra', password: 'HailHydra@2026', lab: 'LAB 5', members: ['Ahsan Ali Khan', 'Hamza Naeem', 'Mohammad Anas'], institution: 'FAST NUCES' },
  { teamName: 'binaryKnights1', password: 'BinKnight1@2026', lab: 'LAB 5', members: ['Muhammad Nihal Sheikh', 'Saad Baseer Khan', 'Muhammad Amaan'], institution: 'DUET' },
  { teamName: 'Dominators', password: 'Dominate@2026', lab: 'LAB 5', members: ['Abbas Fakkharudin', 'SYED MUBEEN HAIDER', 'Rahoul Kumar'], institution: 'Bahria University' },
  
  // LAB 6 Teams
  { teamName: 'SELECTive_Chaos', password: 'SelectChaos@2026', lab: 'LAB 6', members: ['Mishal Fahim', 'Dua Sohail Motiwala', 'Manahil Zulfiqar'], institution: 'FAST NUCES' },
  { teamName: 'Cache_Hit', password: 'CacheHit@2026', lab: 'LAB 6', members: ['Muhammad Mushahid Hussain', 'Muhammad Murtajiz'], institution: 'SMIU' },
  { teamName: 'QMts', password: 'QMtsteam@2026', lab: 'LAB 6', members: ['Muhammad Hanzala Jamil', 'Arham Rasheed', 'Huzaifa Altaf'], institution: 'FAST NUCES' },
  { teamName: 'Code_Diggers', password: 'CodeDig@2026', lab: 'LAB 6', members: ['Hania Adnan Siddiqui', 'Manal Hussain', 'Mherah Fatima'], institution: 'NED University' },
  { teamName: 'The_Dreamers', password: 'Dreamers@2026', lab: 'LAB 6', members: ['Zainab', 'Muhammad Shahmeer Latif'], institution: 'FAST NUCES' },
  { teamName: 'Query_Crafter', password: 'QueryCraft@2026', lab: 'LAB 6', members: ['Hamza Niaz', 'Abdullah Khilji', 'Mirza Bilal Hussain'], institution: 'Hamdard University' },
  { teamName: 'Paradox', password: 'Paradox@2026', lab: 'LAB 6', members: ['Ali Kashif', 'Hammad Abdul Rahim', 'Ismail Silat'], institution: 'FAST NUCES' },
  { teamName: 'Null_pointers', password: 'NullPtr@2026', lab: 'LAB 6', members: ['Rafia Ameen', 'Shaeem Imran', 'Abeeha Asif'], institution: 'IoBM' },
  { teamName: 'Aloo_biryani', password: 'AlooBir@2026', lab: 'LAB 6', members: ['Rafay ghouri', 'Abdurehman', 'Muhammad Ali Adeel'], institution: 'FAST NUCES' },
  { teamName: 'Human_for_loop', password: 'HumanLoop@2026', lab: 'LAB 6', members: ['Muhammad Umer', 'Taha Faisal'], institution: 'NED UET' },
  { teamName: 'Bare_minimum', password: 'BareMin@2026', lab: 'LAB 6', members: ['Abdul Rafay Tariq', 'Ahmed Affan', 'Muhammad Hashir Siddiqui'], institution: 'FAST NUCES' },
  { teamName: 'Fallout_Normalizers', password: 'Fallout@2026', lab: 'LAB 6', members: ['Syed Muhammad Rayyan', 'Muhammad Furqan Mohsin', 'Anas Iqbal'], institution: 'NED University' },
  { teamName: 'Musafir', password: 'Musafir@2026', lab: 'LAB 6', members: ['Muhammad Omer', 'Danish Ahmed', 'Zeeshan Ayaz'], institution: 'FAST NUCES' },
  { teamName: 'Bilal_Ahmed', password: 'BilalAhmed@2026', lab: 'LAB 6', members: ['Bilal Ahmed'], institution: 'Virtual University' },
  { teamName: 'codonomists', password: 'Codonomists@2026', lab: 'LAB 6', members: ['Tehreem', 'Rabia', 'Raheen Zia'], institution: 'FAST NUCES' },
  { teamName: 'Code_Warriors', password: 'CodeWar@2026', lab: 'LAB 6', members: ['Akhyar Ahmed Turk', 'Muhammad Obaid Majeed', 'Muhammad Uzzam Siddiqui'], institution: 'NED University' },
  { teamName: 'AntiGPT', password: 'AntiGPT@2026', lab: 'LAB 6', members: ['Yahya Ali', 'Raed Ovais'], institution: 'FAST NUCES' },
  { teamName: 'binaryKnights0', password: 'BinKnight0@2026', lab: 'LAB 6', members: ['Abdullah Farooq', 'Muhammad Fasih', 'Abdul Hayy Khan'], institution: 'DUET' },
];

async function generateExcelSheets() {
  try {
    // Separate teams by lab
    const lab5Teams = teams.filter(t => t.lab === 'LAB 5');
    const lab6Teams = teams.filter(t => t.lab === 'LAB 6');

    // Generate Lab 5 Sheet
    await generateLabSheet(lab5Teams, 'LAB 5', 'Lab_5_Team_Credentials.xlsx');
    
    // Generate Lab 6 Sheet
    await generateLabSheet(lab6Teams, 'LAB 6', 'Lab_6_Team_Credentials.xlsx');

    console.log('\n✅ Excel sheets generated successfully!');
    console.log(`📁 Files saved in: ${path.resolve('../..')}`);
  } catch (error) {
    console.error('❌ Error generating Excel sheets:', error);
  }
}

async function generateLabSheet(labTeams: TeamData[], labName: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${labName} Teams`);

  // Set column widths
  worksheet.columns = [
    { header: 'Sr. No.', key: 'srNo', width: 10 },
    { header: 'Team Name', key: 'teamName', width: 25 },
    { header: 'Password', key: 'password', width: 20 },
    { header: 'Members', key: 'members', width: 50 },
    { header: 'Institution', key: 'institution', width: 30 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add team data
  labTeams.forEach((team, index) => {
    const row = worksheet.addRow({
      srNo: index + 1,
      teamName: team.teamName,
      password: team.password,
      members: team.members?.join(', ') || '',
      institution: team.institution || ''
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' }
      };
    }

    // Center align Sr. No.
    row.getCell('srNo').alignment = { horizontal: 'center' };
    
    // Password styling (bold and highlighted)
    row.getCell('password').font = { bold: true, color: { argb: 'C00000' } };
    
    // Wrap text for members
    row.getCell('members').alignment = { wrapText: true, vertical: 'top' };
    row.height = Math.max(20, Math.ceil((team.members?.join(', ').length || 0) / 40) * 15);
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Add title and instructions above the table
  worksheet.spliceRows(1, 0, 
    ['Query Quest Competition - Team Credentials'],
    [labName],
    [''],
    ['IMPORTANT: Keep these credentials secure and share only with your team members'],
    ['']
  );

  // Style title
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16, color: { argb: '4472C4' } };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:E1');

  // Style lab name
  const labRow = worksheet.getRow(2);
  labRow.font = { bold: true, size: 14, color: { argb: '000000' } };
  labRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A2:E2');

  // Style instructions
  const instructionRow = worksheet.getRow(4);
  instructionRow.font = { italic: true, size: 10, color: { argb: 'FF0000' } };
  instructionRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A4:E4');

  // Page setup for printing/PDF export
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape', // Horizontal orientation for better fit
    fitToPage: true,
    fitToWidth: 1, // Fit all columns on one page width
    fitToHeight: 0, // Allow multiple pages vertically if needed
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3
    },
    printArea: `A1:E${worksheet.rowCount}`,
    horizontalCentered: true
  };

  // Set print options
  worksheet.properties.defaultRowHeight = 15;

  // Save file
  const filePath = path.resolve('../../', fileName);
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Generated: ${fileName} (${labTeams.length} teams)`);
}

// Run the script
generateExcelSheets();
