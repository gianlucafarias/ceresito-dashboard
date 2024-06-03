'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, Circle, useJsApiLoader, InfoWindow, Marker } from '@react-google-maps/api';
import { Badge } from '@/components/ui/badge';

const mapStyles = 
[
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
]

  const colorsByReclamoType = {
    Arboles: 'green',
    Luminarias: 'blue',
    Arreglos: 'yellow',
    Animales: 'red'
  };

const containerStyle = {
  width: '100%',
  height: '90vh'
};

const center = {
  lat: -29.882278,
  lng: -61.946492
};

export default function Page() {
  const [locations, setLocations] = useState([]);
  const [selectedReclamo, setSelectedReclamo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: 'fa2fbf044e3887e0',
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEYS as string
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('https://api.ceres.gob.ar/api/api/reclamos');
        const data = await response.json();

        const locationsWithNumbers = data.map(reclamo => ({
          ...reclamo,
          latitud: parseFloat(reclamo.latitud),
          longitud: parseFloat(reclamo.longitud)
        }));

        setLocations(locationsWithNumbers);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los reclamos:', error);
      }
    }
    fetchData();
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{ styles: mapStyles }} // Aplicar estilos personalizados

    >
      {loading ? null : (
        locations.map(reclamo => (
       
          <Marker
          key={reclamo.id}
          position={{ lat: reclamo.latitud, lng: reclamo.longitud }}
          onClick={() => setSelectedReclamo(reclamo)}
        />
        ))
      )}
      
      {selectedReclamo && (
        <InfoWindow
          position={{ lat: selectedReclamo.latitud, lng: selectedReclamo.longitud }}
          onCloseClick={() => setSelectedReclamo(null)}
        >
          <div>
            <div>
              <h3 className="font-medium">Fecha:</h3>
              <p>{selectedReclamo.fecha}</p>
            </div>
           
            <p>Reclamo: <Badge variant="destructive">{selectedReclamo?.reclamo}</Badge></p>
            <p>Ubicación: {selectedReclamo.ubicacion}</p>
            <p>Barrio: {selectedReclamo.barrio}</p>
            <p>Estado: {selectedReclamo.estado}</p>
            <p>Detalle: {selectedReclamo.detalle}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : null;
}