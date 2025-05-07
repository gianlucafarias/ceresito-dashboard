"use client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Contact } from "@/types/contact";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { columns } from "./columns";
import { SortingState } from "@tanstack/react-table";
import React from "react";

interface ContactsClientProps {
  data: Contact[];
  sorting?: SortingState;
  setSorting?: React.Dispatch<React.SetStateAction<SortingState>>;
}

export const ContactClient: React.FC<ContactsClientProps> = ({ 
  data, 
  sorting,
  setSorting,
}) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={`Contactos de Ceresito (${data.length})`}
          description="Gestionar contactos"
        />
        {/* TODO: Implementar la funcionalidad de agregar nuevo contacto si es necesario */}
        {/* <Button
          className="text-xs md:text-sm"
          onClick={() => router.push(`/dashboard/contacts/new`)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button> */}
      </div>
      <Separator />
      <DataTable 
        searchKey="contact_name" 
        columns={columns} 
        data={data} 
        sorting={sorting}
        setSorting={setSorting}
      />
    </>
  );
}; 