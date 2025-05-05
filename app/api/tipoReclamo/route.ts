import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma';


export async function POST(request: Request) {
    const {nombre} = await request.json();
    const newTipoReclamo = await prisma.tipoReclamo.create({
         data: {
             nombre,
         },
    });
    
    return NextResponse.json(newTipoReclamo)
 }

 export async function GET() {
    const obtenerTipoReclamo = await prisma.tipoReclamo.findMany();
    return NextResponse.json(obtenerTipoReclamo)
 }

 // La lógica DELETE se movió a app/api/tipoReclamo/[id]/route.ts

