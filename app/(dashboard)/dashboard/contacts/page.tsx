"use client";

import BreadCrumb from "@/components/breadcrumb";
import { ContactClient } from "@/components/tables/contact-tables/client";
import { Contact } from "@/types/contact";
import { useEffect, useState, useCallback } from "react";
import { SortingState } from "@tanstack/react-table"; // Importado

const breadcrumbItems = [{ title: "Contacts", link: "/dashboard/contacts" }];

// SortOrder ya no es necesario aquí, SortingState lo maneja.
// export type SortOrder = "asc" | "desc"; 

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Estado de ordenamiento para TanStack Table
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }, // Orden inicial por createdAt descendente
  ]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sorting.length > 0) {
        const sortItem = sorting[0]; // Asumimos un solo criterio de ordenamiento
        params.append("sort", sortItem.id);
        params.append("order", sortItem.desc ? "desc" : "asc");
      }
      const response = await fetch(`https://api.ceres.gob.ar/api/api/contacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setContacts(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      console.error("Failed to fetch contacts:", e);
    } finally {
      setLoading(false);
    }
  }, [sorting]); // Ahora depende de 'sorting'

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // handleSort ya no es necesario, setSorting de TanStack Table lo maneja
  // const handleSort = (columnKey: string) => { ... };

  if (loading) {
    return <p>Loading contacts...</p>;
  }

  if (error) {
    return <p>Error loading contacts: {error}</p>;
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <ContactClient
          data={contacts}
          sorting={sorting} // Pasar estado de ordenamiento
          setSorting={setSorting} // Pasar actualizador de ordenamiento
        />
      </div>
    </>
  );
} 