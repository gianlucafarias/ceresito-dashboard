"use server"
import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json', 'utf-8'));


const serviceAccountAuth = new JWT({
    email: CREDENTIALS.client_email,
    key: CREDENTIALS.private_key,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet('1eqgDBQtHqHmZcBF7IzK7-GgOQBSMBlmI9ZR667v4UF8', serviceAccountAuth);


export async function GET() {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[7];
    const rows = await sheet.getRows();
    const data = rows.map(row => ({
        fecha: row._rawData[0],
        nombre: row._rawData[1],
        telefono: row._rawData[2],
        ubicacion: row._rawData[3],
        barrio: row._rawData[4],
        imagen: row._rawData[5],
      }));
      return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
