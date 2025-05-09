import BreadCrumb from "@/components/breadcrumb";
import { UserClient } from "@/components/tables/user-tables/client";
// import { users } from "@/constants/data"; // Eliminada importación problemática

const breadcrumbItems = [{ title: "User", link: "/dashboard/user" }];
export default function page() {
  return (
    <>
      <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        {/* TODO: Reemplazar 'users' con datos reales o una fuente de datos válida */}
        <UserClient data={[]} /> 
      </div>
    </>
  );
}
