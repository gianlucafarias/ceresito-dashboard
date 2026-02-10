"use client";

import BreadCrumb from "@/components/breadcrumb";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CalendarTabContent } from "./_components/calendar-tab-content";
import { DutyTabContent } from "./_components/duty-tab-content";
import { EditPharmacyDialog } from "./_components/edit-pharmacy-dialog";
import { PharmaciesTabContent } from "./_components/pharmacies-tab-content";
import { QuickPreviewSection } from "./_components/quick-preview-section";
import { useFarmaciasTurno } from "./_hooks/use-farmacias-turno";

const breadcrumbItems = [
  { title: "Ceresito", link: "/dashboard/ceresito" },
  { title: "Farmacias de turno", link: "/dashboard/ceresito/farmacias-turno" },
];

export default function FarmaciasTurnoPage() {
  const vm = useFarmaciasTurno();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Heading
          title="Farmacias de turno"
          description="Calendario completo, cambio de turno por dia y actualizacion de datos de farmacia."
        />
      </div>
      <Separator />

      <QuickPreviewSection
        isLoadingQuickPreview={vm.isLoadingQuickPreview}
        quickPreview={vm.quickPreview}
        pharmacyMap={vm.pharmacyMap}
      />

      <Tabs
        value={vm.activeTab}
        onValueChange={(value) =>
          vm.setActiveTab(value as "calendar" | "duty" | "pharmacies")
        }
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="calendar">Calendario completo</TabsTrigger>
          <TabsTrigger value="duty">Cambiar turno por dia</TabsTrigger>
          <TabsTrigger value="pharmacies">Editar farmacias</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarTabContent
            monthTitle={vm.monthTitle}
            isLoadingMonth={vm.isLoadingMonth}
            monthError={vm.monthError}
            monthDays={vm.monthDays}
            assignmentMap={vm.assignmentMap}
            pharmacyMap={vm.pharmacyMap}
            onPrevMonth={vm.onPrevMonth}
            onNextMonth={vm.onNextMonth}
            onCurrentMonth={vm.onCurrentMonth}
            onReload={vm.onReload}
            onQuickEditDay={vm.handleQuickEditDay}
          />
        </TabsContent>

        <TabsContent value="duty" className="space-y-4">
          <DutyTabContent
            selectedDutyDate={vm.selectedDutyDate}
            setSelectedDutyDate={vm.setSelectedDutyDate}
            selectedDutyPharmacyCode={vm.selectedDutyPharmacyCode}
            setSelectedDutyPharmacyCode={vm.setSelectedDutyPharmacyCode}
            availablePharmacyCodes={vm.availablePharmacyCodes}
            pharmacyMap={vm.pharmacyMap}
            isLoadingPharmacies={vm.isLoadingPharmacies}
            handleApplyDutyChange={vm.handleApplyDutyChange}
            isSavingDuty={vm.isSavingDuty}
            isLoadingSelectedDuty={vm.isLoadingSelectedDuty}
            selectedDutyDetail={vm.selectedDutyDetail}
            selectedDateTitle={vm.selectedDateTitle}
            currentSelectedPharmacy={vm.currentSelectedPharmacy}
          />
        </TabsContent>

        <TabsContent value="pharmacies" className="space-y-4">
          <PharmaciesTabContent
            pharmacySearch={vm.pharmacySearch}
            setPharmacySearch={vm.setPharmacySearch}
            pharmacyLookupCode={vm.pharmacyLookupCode}
            setPharmacyLookupCode={vm.setPharmacyLookupCode}
            isLookupLoading={vm.isLookupLoading}
            handleLookupPharmacy={vm.handleLookupPharmacy}
            filteredPharmacies={vm.filteredPharmacies}
            openEditPharmacyDialog={vm.openEditPharmacyDialog}
          />
        </TabsContent>
      </Tabs>

      <EditPharmacyDialog
        isOpen={vm.isPharmacyDialogOpen}
        setIsOpen={vm.setIsPharmacyDialogOpen}
        editingPharmacy={vm.editingPharmacy}
        updateEditingPharmacy={vm.updateEditingPharmacy}
        handleSavePharmacy={vm.handleSavePharmacy}
        isSavingPharmacy={vm.isSavingPharmacy}
      />
    </div>
  );
}
