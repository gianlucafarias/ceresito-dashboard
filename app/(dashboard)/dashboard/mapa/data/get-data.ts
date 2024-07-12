import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';
import { JWT } from 'google-auth-library';

const RESPONSES_SHEET_ID = process.env.RESPONSES_SHEET_ID;
const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json', 'utf-8'));

const serviceAccountAuth = new JWT({
  email: CREDENTIALS.client_email,
  key: CREDENTIALS.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID, serviceAccountAuth);

export async function GET(request: Request) {
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['Hoja 1'];
  const rows = await sheet.getRows();
  const locations = rows.map((row) => [row._rawData[8], row._rawData[9]]);
  return new Response(JSON.stringify(locations));
}