import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';

const RESPONSES_SHEET_ID = process.env.RESPONSE_SHEET_ID!;
const CREDENTIALS = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));


const serviceAccountAuth = new JWT({
    email: CREDENTIALS.client_email,
    key: CREDENTIALS.private_key,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID, serviceAccountAuth);

export const getPodaData = async () => {
    try {
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[7];
      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        fecha: row.Fecha,
        nombre: row.Nombre,
        telefono: row.Telefono,
        ubicacion: row.Ubicacion,
        barrio: row.Barrio,
        imagen: row.Imagen,
      }));
      return data;
    } catch (err) {
      console.error('Error al obtener los reclamos', err);
      throw err;
    }
  };
