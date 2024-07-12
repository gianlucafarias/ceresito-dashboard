import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClockIcon, FilterIcon, ListOrderedIcon,  UsersIcon } from "lucide-react";

export default function page() {
    return(
<div className="flex flex-col w-full min-h-screen">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cuadrillas Activas</CardTitle>
              <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+2 desde ayer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reclamos Abiertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+12 desde ayer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reclamos Resueltos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+45 desde ayer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h 15m</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">-10 min desde ayer</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Listado de Cuadrillas</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <FilterIcon className="w-4 h-4 mr-2" />
                      Filtrar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filtrar por:</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>Luminarias</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Arreglos</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Animales</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Árboles</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <ListOrderedIcon className="w-4 h-4 mr-2" />
                      Ordenar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuRadioGroup value="id">
                      <DropdownMenuRadioItem value="id">ID</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="phone">Teléfono</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="type">Tipo</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">C001</TableCell>
                  <TableCell>+1 (555) 123-4567</TableCell>
                  <TableCell>Luminarias</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">C002</TableCell>
                  <TableCell>+1 (555) 987-6543</TableCell>
                  <TableCell>Arreglos</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">C003</TableCell>
                  <TableCell>+1 (555) 456-7890</TableCell>
                  <TableCell>Animales</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">C004</TableCell>
                  <TableCell>+1 (555) 321-0987</TableCell>
                  <TableCell>Árboles</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">C005</TableCell>
                  <TableCell>+1 (555) 789-0123</TableCell>
                  <TableCell>Luminarias</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
    )
}