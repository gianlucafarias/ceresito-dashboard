import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EncuestaVecinal } from "@/types";

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(new Date(date));
}

export function exportEncuestaToPDF(encuesta: EncuestaVecinal) {
  const doc = new jsPDF();
  
  // Configuración de fuentes y colores
  const titleColor: [number, number, number] = [41, 128, 185]; // Azul
  const headerColor: [number, number, number] = [52, 73, 94]; // Gris oscuro
  const textColor: [number, number, number] = [44, 62, 80]; // Gris muy oscuro
  
  // Título principal
  doc.setFontSize(20);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text("ENCUESTA VECINAL - OBRAS PÚBLICAS", 20, 30);
  
  // Línea decorativa
  doc.setDrawColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.setLineWidth(1);
  doc.line(20, 35, 190, 35);
  
  // Información básica
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("INFORMACIÓN GENERAL", 20, 50);
  
  const infoBasica = [
    ["ID de Encuesta:", encuesta.id.toString()],
    ["Barrio:", encuesta.barrio],
    ["Fecha de Creación:", formatDate(encuesta.fechaCreacion)],
    ["Estado:", encuesta.estado],
  ];
  
  autoTable(doc, {
    startY: 55,
    head: [],
    body: infoBasica,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Obras Urgentes
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("OBRAS CONSIDERADAS URGENTES", 20, currentY);
  
  const obrasUrgentesData = encuesta.obrasUrgentes.map((obra, index) => [
    `${index + 1}.`,
    obra
  ]);
  
  if (encuesta.obrasUrgentesOtro && encuesta.obrasUrgentesOtro.trim()) {
    obrasUrgentesData.push([
      `${obrasUrgentesData.length + 1}.`,
      `Otra: ${encuesta.obrasUrgentesOtro}`
    ]);
  }
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [],
    body: obrasUrgentesData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Servicios a Mejorar
  const currentY2 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("SERVICIOS QUE NECESITAN MEJORAR", 20, currentY2);
  
  const serviciosMejorarData = encuesta.serviciosMejorar.map((servicio, index) => [
    `${index + 1}.`,
    servicio
  ]);
  
  if (encuesta.serviciosMejorarOtro && encuesta.serviciosMejorarOtro.trim()) {
    serviciosMejorarData.push([
      `${serviciosMejorarData.length + 1}.`,
      `Otro: ${encuesta.serviciosMejorarOtro}`
    ]);
  }
  
  autoTable(doc, {
    startY: currentY2 + 5,
    head: [],
    body: serviciosMejorarData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Propuestas y comentarios
  let currentY3 = (doc as any).lastAutoTable.finalY + 15;
  
  if (encuesta.espacioMejorar && encuesta.espacioMejorar.trim()) {
    doc.setFontSize(12);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text("ESPACIO PÚBLICO A MEJORAR", 20, currentY3);
    
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const espacioLines = doc.splitTextToSize(encuesta.espacioMejorar, 170);
    doc.text(espacioLines, 20, currentY3 + 8);
    currentY3 = currentY3 + 8 + (espacioLines.length * 5) + 10;
  }
  
  if (encuesta.propuesta && encuesta.propuesta.trim()) {
    doc.setFontSize(12);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text("PROPUESTA ADICIONAL", 20, currentY3);
    
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const propuestaLines = doc.splitTextToSize(encuesta.propuesta, 170);
    doc.text(propuestaLines, 20, currentY3 + 8);
    currentY3 = currentY3 + 8 + (propuestaLines.length * 5) + 10;
  }

  // Información de contacto
  const currentY5 = currentY3;
  
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("INFORMACIÓN DE CONTACTO", 20, currentY5);
  
  const contactoData = [
    ["¿Quiere ser contactado?:", encuesta.quiereContacto ? "Sí" : "No"],
  ];
  
  if (encuesta.quiereContacto) {
    if (encuesta.nombreCompleto && encuesta.nombreCompleto.trim()) {
      contactoData.push(["Nombre Completo:", encuesta.nombreCompleto]);
    }
    if (encuesta.telefono && encuesta.telefono.trim()) {
      contactoData.push(["Teléfono:", encuesta.telefono]);
    }
    if (encuesta.email && encuesta.email.trim()) {
      contactoData.push(["Email:", encuesta.email]);
    }
  }
  
  autoTable(doc, {
    startY: currentY5 + 5,
    head: [],
    body: contactoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Municipalidad de Ceres - Encuesta Vecinal de Obras Públicas", 20, pageHeight - 20);
  doc.text(`Generado el: ${formatDate(new Date())}`, 20, pageHeight - 15);
  
  // Guardar el PDF
  doc.save(`encuesta-vecinal-${encuesta.id}.pdf`);
}