import { google } from 'googleapis';
import { readFileSync } from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const CREDENTIALS_PATH = './credentials.json';

export async function getGoogleSheetsClient() {
  const  client_email = process.env.GOOGLE_CLIENT_EMAIL
  const private_key = process.env.GOOGLE_PRIVATE_KEY
  const auth = new google.auth.JWT(client_email, undefined, private_key, SCOPES);
  await auth.authorize();

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
