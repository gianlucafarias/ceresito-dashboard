import { useState, useEffect } from 'react';

const MOBILE_WIDTH_THRESHOLD = 768; // Ancho típico para considerar móvil (ej. md breakpoint de Tailwind)

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDeviceSize = () => {
      // Asegurarse de que window esté definido (evita errores en SSR)
      if (typeof window !== 'undefined') {
          setIsMobile(window.innerWidth < MOBILE_WIDTH_THRESHOLD);
      }
    };

    // Comprobar al montar y al cambiar tamaño de ventana
    checkDeviceSize();
    window.addEventListener('resize', checkDeviceSize);

    // Limpiar el listener al desmontar
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, []);

  return isMobile;
} 