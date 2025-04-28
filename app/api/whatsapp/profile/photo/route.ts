import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_API_VERSION = process.env.VERSION_API_META || 'v19.0'; // Usa variable de entorno o fallback
const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

// Asegúrate de que estas variables de entorno estén configuradas
const PHONE_NUMBER_ID = process.env.NUMBER_ID_META;
const ACCESS_TOKEN = process.env.JWT_TOKEN_META;
const APP_ID = process.env.FACEBOOK_APP_ID; // Nueva variable

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN || !APP_ID) { // Añadir chequeo para APP_ID
  console.error("Error: Las variables de entorno NUMBER_ID_META, JWT_TOKEN_META y FACEBOOK_APP_ID son requeridas.");
}

/**
 * GET: Obtiene la URL de la foto de perfil actual.
 */
export async function GET(request: NextRequest) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Variables de entorno no configuradas para GET' }, { status: 500 });
  }

  const url = `${BASE_URL}/${PHONE_NUMBER_ID}/whatsapp_business_profile?fields=profile_picture_url`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      cache: 'no-store', // Para asegurar que obtenemos la URL más reciente
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API GET Error] Fetching WhatsApp profile picture URL:', errorData);
      return NextResponse.json({ error: 'Error al obtener la foto de WhatsApp', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log('[API GET Debug] Received from Facebook API:', data);
    // Extraer la URL de la estructura correcta devuelta por la API
    const photoUrl = data?.data?.[0]?.profile_picture_url || null;
    console.log('[API GET Debug] Extracted photoUrl:', photoUrl);
    return NextResponse.json({ photoUrl });

  } catch (error) {
    console.error('[Server Error] GET /api/whatsapp/profile/photo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST: Actualiza la foto de perfil usando el flujo de carga de 3 pasos.
 * Espera FormData con un campo 'file' que contiene la imagen.
 */
export async function POST(request: NextRequest) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN || !APP_ID) {
    return NextResponse.json({ error: 'Variables de entorno no configuradas para POST' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const fileSize = file.size;
    const fileType = file.type;
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // --- Paso 1: Iniciar Sesión de Carga --- (Usando App ID)
    const startSessionUrl = `${BASE_URL}/${APP_ID}/uploads?file_length=${fileSize}&file_type=${fileType}&access_token=${ACCESS_TOKEN}`;
    let sessionId = '';
    try {
      const sessionResponse = await fetch(startSessionUrl, { method: 'POST' });
      if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          console.error('[API POST Error - Step 1] Start Upload Session:', errorData);
          throw new Error(`Error al iniciar sesión de carga: ${errorData.error?.message || sessionResponse.statusText}`);
      }
      const sessionData = await sessionResponse.json();
      sessionId = sessionData.id;
      if (!sessionId) {
           throw new Error('No se recibió ID de sesión de carga');
      }
      console.log('Upload session started:', sessionId);
    } catch (error: any) {
      console.error('[Server Error - Step 1]', error);
      return NextResponse.json({ error: 'Error interno iniciando subida', details: error.message }, { status: 500 });
    }

    // --- Paso 2: Subir Contenido Binario --- (Usando Session ID y OAuth Token)
    const uploadUrl = `${BASE_URL}/${sessionId}`;
    let fileHandle = '';
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${ACCESS_TOKEN}`,
          'file_offset': '0'
          // Content-Type lo añade fetch automáticamente para Buffer?
          // La documentación/SO no es clara si se necesita Content-Type aquí, probemos sin él.
          // Si falla, podríamos necesitar añadir 'Content-Type': 'application/octet-stream' o fileType?
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('[API POST Error - Step 2] Uploading binary data:', errorData);
          throw new Error(`Error al subir el archivo: ${errorData.error?.message || uploadResponse.statusText}`);
      }
      const uploadData = await uploadResponse.json();
      fileHandle = uploadData.h;
       if (!fileHandle) {
           throw new Error('No se recibió handle del archivo subido');
       }
      console.log('File uploaded, handle:', fileHandle);
    } catch (error: any) {
       console.error('[Server Error - Step 2]', error);
       return NextResponse.json({ error: 'Error interno subiendo archivo', details: error.message }, { status: 500 });
    }

    // --- Paso 3: Actualizar Perfil --- (Usando Phone Number ID y File Handle)
    const updateProfileUrl = `${BASE_URL}/${PHONE_NUMBER_ID}/whatsapp_business_profile`;
    try {
      const updateResponse = await fetch(updateProfileUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          profile_picture_handle: fileHandle,
        }),
      });

       if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('[API POST Error - Step 3] Updating profile:', errorData);
          throw new Error(`Error al actualizar perfil: ${errorData.error?.message || updateResponse.statusText}`);
      }

      const updateData = await updateResponse.json();
       if (!updateData.success) {
           console.error('[API POST Error - Step 3] Update unsuccessful:', updateData);
           throw new Error('La API indicó que la actualización no fue exitosa.');
       }
      console.log('Profile picture updated successfully');

    } catch (error: any) {
      console.error('[Server Error - Step 3]', error);
      return NextResponse.json({ error: 'Error interno actualizando perfil', details: error.message }, { status: 500 });
    }

    // Si todo fue bien:
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Server Error] POST /api/whatsapp/profile/photo:', error);
    // Error genérico si algo falló antes de los pasos específicos (ej: leyendo formData)
    return NextResponse.json({ error: 'Error interno del servidor en POST', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Elimina la foto de perfil actual.
 * NOTA: Este endpoint /settings/profile/photo podría ser de la API On-Premise.
 * La API Cloud podría requerir actualizar el perfil con un handle vacío o nulo.
 * Se necesita verificar la documentación de la API Cloud para la eliminación.
 * Por ahora, la dejamos como estaba, pero podría fallar.
 */
export async function DELETE(request: NextRequest) {
   if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Variables de entorno no configuradas para DELETE' }, { status: 500 });
  }

  // TODO: Verificar si este es el método correcto para la API Cloud.
  // Podría ser necesario un POST a /whatsapp_business_profile con profile_picture_handle nulo o vacío.
  const url = `${BASE_URL}/${PHONE_NUMBER_ID}/settings/profile/photo`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

     if (!response.ok) {
      const errorData = await response.text(); // Puede ser texto plano
      console.error('[API DELETE Error] Deleting WhatsApp profile picture:', response.status, errorData);
       try {
         const jsonData = JSON.parse(errorData);
         return NextResponse.json({ error: 'Error al eliminar la foto de WhatsApp', details: jsonData }, { status: response.status });
      } catch (parseError) {
         return NextResponse.json({ error: 'Error al eliminar la foto de WhatsApp', details: errorData }, { status: response.status });
      }
    }
    console.log('Profile picture deleted successfully (if endpoint is correct)');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Server Error] DELETE /api/whatsapp/profile/photo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 