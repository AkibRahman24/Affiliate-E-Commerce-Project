const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } = require('docx');

const PASSWORD = 'ChangeMe123!';

const accounts = {
  admin: [
    { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin' },
  ],
  customers: [
    { firstName: 'Fatima', lastName: 'Begum', email: 'fatima.c@novatechbd.com', role: 'customer' },
    { firstName: 'Kamal', lastName: 'Hossain', email: 'kamal.c@novatechbd.com', role: 'customer' },
    { firstName: 'Nasrin', lastName: 'Akhter', email: 'nasrin.c@novatechbd.com', role: 'customer' },
    { firstName: 'Shahidul', lastName: 'Alam', email: 'shahidul.c@novatechbd.com', role: 'customer' },
    { firstName: 'Tahmina', lastName: 'Rahman', email: 'tahmina.c@novatechbd.com', role: 'customer' },
    { firstName: 'Jubayer', lastName: 'Hasan', email: 'jubayer.c@novatechbd.com', role: 'customer' },
    { firstName: 'Sanjida', lastName: 'Sultana', email: 'sanjida.c@novatechbd.com', role: 'customer' },
    { firstName: 'Mizanur', lastName: 'Rahman', email: 'mizanur.c@novatechbd.com', role: 'customer' },
    { firstName: 'Rina', lastName: 'Begum', email: 'rina.c@novatechbd.com', role: 'customer' },
    { firstName: 'Tariqul', lastName: 'Islam', email: 'tariqul.c@novatechbd.com', role: 'customer' },
  ],
  affiliates: [
    { firstName: 'Mahmudul', lastName: 'Hasan', email: 'mahmudul.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Sajeda', lastName: 'Parvin', email: 'sajeda.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Enamul', lastName: 'Haque', email: 'enamul.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Parveen', lastName: 'Sultana', email: 'parveen.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Jahangir', lastName: 'Alam', email: 'jahangir.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Roksana', lastName: 'Akhter', email: 'roksana.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Nurul', lastName: 'Islam', email: 'nurul.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Shahnaz', lastName: 'Begum', email: 'shahnaz.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Abul', lastName: 'Kalam', email: 'abul.a@novatechbd.com', role: 'affiliate' },
    { firstName: 'Hasina', lastName: 'Ahmed', email: 'hasina.a@novatechbd.com', role: 'affiliate' },
  ],
};

const headerCell = (text) =>
  new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
    shading: { fill: '1e293b' },
  });

const dataCell = (text, bold = false) =>
  new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })], alignment: AlignmentType.CENTER })],
    shading: { fill: 'f8fafc' },
  });

const buildTable = (rows, sectionLabel) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [headerCell('Name'), headerCell('Email'), headerCell('Role'), headerCell('Password')],
  });

  const dataRows = rows.map(
    (r) =>
      new TableRow({
        children: [
          dataCell(`${r.firstName} ${r.lastName}`, true),
          dataCell(r.email),
          dataCell(r.role),
          dataCell(PASSWORD),
        ],
      })
  );

  return [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: sectionLabel, bold: true, size: 28, color: '0f172a' })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  ];
};

const generate = async () => {
  const doc = new Document({
    title: 'NovaTech BD - Test Credentials',
    description: 'Mock login credentials for testing the NovaTech BD affiliate e-commerce platform',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'NovaTech BD', bold: true, size: 48, color: '0f172a' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Test Credentials – Affiliate E-Commerce Platform', size: 28, color: '64748b' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'Global Password: ', bold: true, size: 22 }),
              new TextRun({ text: PASSWORD, size: 22, color: '2563eb', bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'Use these accounts to test the platform. Admin can access /admin/dashboard, affiliates can access /affiliate/dashboard, and customers can browse, cart, and checkout.', size: 20, color: '64748b' }),
            ],
          }),

          ...buildTable(accounts.admin, 'Admin Account (1)'),
          ...buildTable(accounts.customers, 'Customer Accounts (10)'),
          ...buildTable(accounts.affiliates, 'Affiliate Accounts (10)'),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
            children: [
              new TextRun({ text: 'NovaTech BD — Bangladesh\'s Premium Electronics Marketplace', size: 18, color: '94a3b8', italics: true }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve(__dirname, '..', 'NovaTech_BD_Test_Credentials.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`Credentials document created: ${outPath}`);
};

generate().catch((err) => {
  console.error('Failed to generate credentials document:', err);
  process.exit(1);
});
