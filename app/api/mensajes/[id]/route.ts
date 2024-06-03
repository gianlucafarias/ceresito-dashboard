import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cuadrillaId } = req.query;

  if (req.method === 'GET') {
    try {
      const mensajes = await prisma.mensaje.findMany({
        where: { cuadrillaId: parseInt(cuadrillaId as string) },
        orderBy: { timestamp: 'asc' },
      });
      res.status(200).json(mensajes);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el historial de mensajes' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}