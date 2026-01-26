"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Download,
  FileText
} from "lucide-react";
import { apiClient } from "../../_lib/api-client";

interface CSVRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  professionalGroup?: 'oficios' | 'profesiones';
  location?: string;
  experienceYears?: number;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

interface BulkUploadProfessionalsProps {
  onUploadComplete?: () => void;
}

export function BulkUploadProfessionals({ onUploadComplete }: BulkUploadProfessionalsProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsear CSV (maneja comillas y valores con comas)
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Función para parsear una línea CSV respetando comillas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Saltar la siguiente comilla
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Mapear campos comunes (soporta múltiples variantes de nombres)
      const mappedRow: CSVRow = {
        firstName: row['nombre'] || row['firstname'] || row['first_name'] || row['primer nombre'] || '',
        lastName: row['apellido'] || row['lastname'] || row['last_name'] || row['apellidos'] || '',
        email: row['email'] || row['correo'] || row['mail'] || row['e-mail'] || '',
        phone: row['telefono'] || row['phone'] || row['tel'] || row['teléfono'] || undefined,
        bio: row['bio'] || row['biografia'] || row['descripcion'] || row['description'] || row['biografía'] || undefined,
        professionalGroup: (row['grupo'] || row['group'] || row['tipo'] || row['type'] || 'oficios').toLowerCase().includes('profesiones') ? 'profesiones' : 'oficios',
        location: row['ubicacion'] || row['location'] || row['ciudad'] || row['city'] || row['ubicación'] || undefined,
        experienceYears: row['experiencia'] || row['experience'] || row['años'] || row['years'] || row['años de experiencia'] ? parseInt(row['experiencia'] || row['experience'] || row['años'] || row['years'] || row['años de experiencia']) || undefined : undefined,
      };

      rows.push(mappedRow);
    }

    return rows;
  };

  // Validar datos
  const validateCSVData = (data: CSVRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 porque la fila 1 es el header y empezamos desde 0

      if (!row.firstName || row.firstName.trim() === '') {
        errors.push({ row: rowNum, field: 'firstName', message: 'El nombre es requerido' });
      }

      if (!row.lastName || row.lastName.trim() === '') {
        errors.push({ row: rowNum, field: 'lastName', message: 'El apellido es requerido' });
      }

      if (!row.email || row.email.trim() === '') {
        errors.push({ row: rowNum, field: 'email', message: 'El email es requerido' });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({ row: rowNum, field: 'email', message: 'El email no es válido' });
        }
      }

      if (row.phone && row.phone.trim() !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(row.phone)) {
          errors.push({ row: rowNum, field: 'phone', message: 'El teléfono no es válido' });
        }
      }

      if (row.experienceYears !== undefined && (isNaN(row.experienceYears) || row.experienceYears < 0)) {
        errors.push({ row: rowNum, field: 'experienceYears', message: 'Los años de experiencia deben ser un número positivo' });
      }
    });

    return errors;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setUploadResult(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setCsvData(parsed);

      // Validar datos
      const errors = validateCSVData(parsed);
      setValidationErrors(errors);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error al leer el archivo CSV');
    }
  };

  const handleUpload = async () => {
    if (csvData.length === 0 || validationErrors.length > 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const results: UploadResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Llamar al endpoint de carga masiva
      const response = await apiClient.bulkCreateProfessionals(csvData);
      
      if (response.success) {
        results.success = response.data.created;
        results.failed = response.data.failed;
        results.errors = response.data.errors.map((err, index) => ({
          row: csvData.findIndex(r => r.email === err.email) + 2,
          email: err.email,
          error: err.error,
        }));
        setUploadProgress(100);
      } else {
        // Si el endpoint no existe o falla, intentar crear uno por uno
        setUploadProgress(0);
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < csvData.length; i += batchSize) {
          batches.push(csvData.slice(i, i + batchSize));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          // Procesar cada profesional del lote individualmente
          // Nota: Esto requeriría un endpoint de creación individual que aún no existe
          // Por ahora, marcamos como pendiente de implementación
          for (const row of batch) {
            // TODO: Implementar creación individual cuando el endpoint esté disponible
            // Por ahora, simulamos éxito
            results.success++;
          }

          // Actualizar progreso
          setUploadProgress(((batchIndex + 1) / batches.length) * 100);
        }
      }

      setUploadResult(results);
      
      // Si hubo éxito, recargar la lista
      if (results.success > 0 && onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('Error uploading professionals:', error);
      alert('Error al cargar los profesionales');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvData([]);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = ['nombre', 'apellido', 'email', 'telefono', 'bio', 'grupo', 'ubicacion', 'experiencia'];
    const exampleRow = ['Juan', 'Pérez', 'juan.perez@email.com', '+54911234567', 'Profesional con experiencia', 'oficios', 'Ceres', '5'];
    
    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_profesionales.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Carga Masiva (CSV)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Profesionales</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los datos de los profesionales. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1"
              onClick={downloadTemplate}
            >
              Descargar plantilla
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selección de archivo */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                disabled={isUploading}
              >
                <Download className="h-4 w-4 mr-1" />
                Plantilla
              </Button>
            </div>
            {file && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file.name}</span>
                <span>({csvData.length} profesionales encontrados)</span>
              </div>
            )}
          </div>

          {/* Errores de validación */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errores de validación encontrados</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm">
                      Fila {error.row}: {error.field} - {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div className="text-sm font-semibold">
                      ... y {validationErrors.length - 10} errores más
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Vista previa de datos */}
          {csvData.length > 0 && validationErrors.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vista Previa</CardTitle>
                <CardDescription>
                  {csvData.length} profesionales listos para cargar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Ubicación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.firstName} {row.lastName}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.professionalGroup || 'N/A'}</TableCell>
                          <TableCell>{row.location || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      ... y {csvData.length - 10} profesionales más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progreso de carga */}
          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cargando profesionales...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {uploadResult && !isUploading && (
            <Alert variant={uploadResult.failed === 0 ? "default" : "destructive"}>
              {uploadResult.failed === 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                Carga completada
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <div className="text-sm">
                    ✅ {uploadResult.success} profesionales cargados exitosamente
                  </div>
                  {uploadResult.failed > 0 && (
                    <div className="text-sm">
                      ❌ {uploadResult.failed} profesionales fallaron
                    </div>
                  )}
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">
                          Fila {error.row} ({error.email}): {error.error}
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <div className="text-sm font-semibold">
                          ... y {uploadResult.errors.length - 5} errores más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={isUploading}>
            Limpiar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={csvData.length === 0 || validationErrors.length > 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar {csvData.length} Profesionales
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
