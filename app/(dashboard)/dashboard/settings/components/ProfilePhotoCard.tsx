'use client'

import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from '@/lib/utils/cropImage';

const ProfilePhotoCard = () => {
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showCropperDialog, setShowCropperDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const fetchCurrentPhoto = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/profile/photo');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener la foto de perfil');
      }
      const data = await response.json();
      setCurrentPhotoUrl(data.photoUrl || null);
    } catch (error: any) {
      console.error("Fetch photo error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la foto de perfil actual.",
        variant: "destructive",
      });
      setCurrentPhotoUrl(null); // Asegura que no se muestre una foto incorrecta
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentPhoto();
  }, [fetchCurrentPhoto]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
         toast({ title: "Error", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
         event.target.value = '';
         return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ title: "Error", description: "La imagen no debe exceder los 5MB.", variant: "destructive" });
         event.target.value = '';
         return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setCroppedAreaPixels(null);
        setCroppedImageBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setShowCropperDialog(true);
      });
      reader.readAsDataURL(file);

    } else {
       setImageSrc(null);
       setCroppedImageBlob(null);
       if (previewUrl) URL.revokeObjectURL(previewUrl);
       setPreviewUrl(null);
    }
     event.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }
    try {
      setIsLoading(true);
      setShowCropperDialog(false);

      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
      );

      if (croppedImage) {
        setCroppedImageBlob(croppedImage);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(croppedImage));
      }
       setImageSrc(null);

    } catch (e) {
      console.error('Error al recortar:', e);
      toast({ title: "Error", description: "No se pudo recortar la imagen.", variant: "destructive" });
      setImageSrc(null);
      setCroppedImageBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } finally {
       setIsLoading(false);
    }
  }, [imageSrc, croppedAreaPixels, toast, previewUrl]);

  const handleCancelCrop = () => {
     setShowCropperDialog(false);
     setImageSrc(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpdatePhoto = async () => {
    if (!croppedImageBlob) {
       toast({ title: "Error", description: "Primero selecciona y recorta una imagen.", variant: "destructive" });
       return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', croppedImageBlob, `profile_photo_${Date.now()}.jpg`);

    try {
      const response = await fetch('/api/whatsapp/profile/photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la foto de perfil');
      }

      toast({ title: "Éxito", description: "Foto de perfil actualizada correctamente." });
      setCroppedImageBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      await fetchCurrentPhoto();

    } catch (error: any) {
       console.error("Update photo error:", error);
       toast({
         title: "Error",
         description: error.message || "No se pudo actualizar la foto de perfil.",
         variant: "destructive",
       });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsDeleting(true);
    try {
       const response = await fetch('/api/whatsapp/profile/photo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la foto de perfil');
      }

      toast({ title: "Éxito", description: "Foto de perfil eliminada correctamente." });
      setCurrentPhotoUrl(null);
    } catch (error: any) {
      console.error("Delete photo error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de Perfil de WhatsApp</CardTitle>
        <CardDescription>
          Gestiona la foto de perfil de tu cuenta de WhatsApp Business. Se recomienda una imagen cuadrada de 640x640px.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
            {(isLoading || isUploading || isDeleting) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-full">
                 <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {previewUrl ? (
              <Image src={previewUrl} alt="Previsualización Recortada" width={128} height={128} className="object-cover w-full h-full" key={previewUrl} />
            ) : currentPhotoUrl ? (
               <Image src={currentPhotoUrl} alt="Foto actual" width={128} height={128} className="object-cover w-full h-full" key={currentPhotoUrl} />
            ) : (!isLoading && !isUploading && !isDeleting) ? (
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Sin foto</span>
            ) : null}
          </div>
          <Input
            id="profilePictureInput"
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            disabled={isUploading || isDeleting || isLoading}
            className="max-w-xs"
          />
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          <Button
            onClick={handleUpdatePhoto}
            disabled={!croppedImageBlob || isUploading || isDeleting || isLoading}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Actualizar Foto
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePhoto}
            disabled={!currentPhotoUrl || isUploading || isDeleting || isLoading || !!previewUrl || !!croppedImageBlob}
          >
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Eliminar Foto
          </Button>
        </div>
      </CardContent>

      <Dialog open={showCropperDialog} onOpenChange={(open) => {if (!open) handleCancelCrop(); setShowCropperDialog(open);}}>
        <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Recortar Imagen</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <div className="relative w-full h-[400px] bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          <div className="flex items-center space-x-4 py-4">
            <span className="text-sm">Zoom:</span>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
              disabled={!imageSrc}
            />
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={handleCancelCrop}>Cancelar</Button>
             <Button onClick={handleConfirmCrop} disabled={!croppedAreaPixels || isLoading}>Confirmar Recorte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProfilePhotoCard; 