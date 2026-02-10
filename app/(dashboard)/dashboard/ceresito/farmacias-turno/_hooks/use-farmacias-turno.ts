"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  DutyAssignment,
  DutyBootstrapResponse,
  DutyCalendarResponse,
  DutyRangeResponse,
  Pharmacy,
  QuickPreviewItem,
  RequestError,
  TabKey,
} from "../_types";
import {
  requestJson,
  requestJsonWithEtag,
  toErrorMessage,
  toISODateOnly,
} from "../_lib/utils";

const PHARMACY_CACHE = new Map<string, Pharmacy>();
const PHARMACY_INFLIGHT = new Map<string, Promise<Pharmacy | null>>();

export interface UseFarmaciasTurnoResult {
  activeTab: TabKey;
  setActiveTab: Dispatch<SetStateAction<TabKey>>;
  monthTitle: string;
  monthDays: Date[];
  assignmentMap: Record<string, DutyAssignment>;
  pharmacyMap: Record<string, Pharmacy>;
  quickPreview: QuickPreviewItem[];
  isLoadingMonth: boolean;
  isLoadingQuickPreview: boolean;
  isLoadingPharmacies: boolean;
  monthError: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onReload: () => void;
  selectedDutyDate: Date | undefined;
  setSelectedDutyDate: Dispatch<SetStateAction<Date | undefined>>;
  selectedDutyPharmacyCode: string;
  setSelectedDutyPharmacyCode: Dispatch<SetStateAction<string>>;
  availablePharmacyCodes: string[];
  isLoadingSelectedDuty: boolean;
  isSavingDuty: boolean;
  selectedDutyDetail: DutyAssignment | null;
  selectedDateTitle: string;
  currentSelectedPharmacy: Pharmacy | undefined;
  handleQuickEditDay: (day: Date, pharmacyCode?: string) => void;
  handleApplyDutyChange: () => Promise<void>;
  pharmacySearch: string;
  setPharmacySearch: Dispatch<SetStateAction<string>>;
  pharmacyLookupCode: string;
  setPharmacyLookupCode: Dispatch<SetStateAction<string>>;
  isLookupLoading: boolean;
  handleLookupPharmacy: () => Promise<void>;
  filteredPharmacies: Pharmacy[];
  isPharmacyDialogOpen: boolean;
  setIsPharmacyDialogOpen: (value: boolean) => void;
  editingPharmacy: Pharmacy | null;
  openEditPharmacyDialog: (pharmacy: Pharmacy) => void;
  updateEditingPharmacy: (partial: Partial<Pharmacy>) => void;
  handleSavePharmacy: () => Promise<void>;
  isSavingPharmacy: boolean;
}

export function useFarmaciasTurno(): UseFarmaciasTurnoResult {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [monthCursor, setMonthCursor] = useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const [reloadTick, setReloadTick] = useState(0);

  const [monthRows, setMonthRows] = useState<DutyAssignment[]>([]);
  const [pharmacyMap, setPharmacyMap] = useState<Record<string, Pharmacy>>({});
  const [quickPreview, setQuickPreview] = useState<QuickPreviewItem[]>([]);

  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingQuickPreview, setIsLoadingQuickPreview] = useState(false);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);

  const [selectedDutyDate, setSelectedDutyDate] = useState<Date | undefined>(
    () => new Date(),
  );
  const [selectedDutyPharmacyCode, setSelectedDutyPharmacyCode] =
    useState<string>("");
  const [selectedDutyDetail, setSelectedDutyDetail] =
    useState<DutyAssignment | null>(null);
  const [isLoadingSelectedDuty, setIsLoadingSelectedDuty] = useState(false);
  const [isSavingDuty, setIsSavingDuty] = useState(false);

  const [pharmacySearch, setPharmacySearch] = useState("");
  const [pharmacyLookupCode, setPharmacyLookupCode] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const [isPharmacyDialogOpen, setIsPharmacyDialogOpenState] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [isSavingPharmacy, setIsSavingPharmacy] = useState(false);

  const pharmacyMapRef = useRef<Record<string, Pharmacy>>({});
  const bootstrapEtagRef = useRef<Record<string, string>>({});
  const bootstrapCacheRef = useRef<Record<string, DutyBootstrapResponse>>({});

  useEffect(() => {
    pharmacyMapRef.current = pharmacyMap;
  }, [pharmacyMap]);

  const upsertPharmacies = useCallback(
    (items: Array<Pharmacy | null | undefined>) => {
      const clean = items.filter(
        (item): item is Pharmacy => !!item && !!item.code,
      );
      if (clean.length === 0) return;

      const normalized = clean.map((pharmacy) => ({
        ...pharmacy,
        code: pharmacy.code.toUpperCase(),
      }));

      normalized.forEach((pharmacy) => {
        PHARMACY_CACHE.set(pharmacy.code, pharmacy);
      });

      setPharmacyMap((current) => {
        const next = { ...current };
        normalized.forEach((pharmacy) => {
          next[pharmacy.code] = pharmacy;
        });
        return next;
      });
    },
    [],
  );

  const fetchPharmacyByCode = useCallback(
    async (
      code: string,
      options?: { silent?: boolean },
    ): Promise<Pharmacy | null> => {
      const normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode) return null;

      const cached = pharmacyMapRef.current[normalizedCode];
      if (cached) return cached;

      const moduleCached = PHARMACY_CACHE.get(normalizedCode);
      if (moduleCached) {
        upsertPharmacies([moduleCached]);
        return moduleCached;
      }

      const inflight = PHARMACY_INFLIGHT.get(normalizedCode);
      if (inflight) return inflight;

      const promise = (async () => {
        try {
          const pharmacy = await requestJson<Pharmacy>(
            `/api/core/pharmacy/${encodeURIComponent(normalizedCode)}`,
          );
          upsertPharmacies([pharmacy]);
          return pharmacy;
        } catch (error) {
          if (!options?.silent) {
            toast.error(
              `No se pudo cargar farmacia ${normalizedCode}: ${toErrorMessage(
                error,
                "error desconocido",
              )}`,
            );
          }
          return null;
        } finally {
          PHARMACY_INFLIGHT.delete(normalizedCode);
        }
      })();

      PHARMACY_INFLIGHT.set(normalizedCode, promise);
      return promise;
    },
    [upsertPharmacies],
  );

  const prefetchPharmacies = useCallback(
    async (codes: string[]) => {
      const uniqueCodes = Array.from(
        new Set(
          codes.map((value) => value.trim().toUpperCase()).filter(Boolean),
        ),
      );
      const fromModuleCache = uniqueCodes
        .map((code) => PHARMACY_CACHE.get(code))
        .filter((pharmacy): pharmacy is Pharmacy => !!pharmacy);
      if (fromModuleCache.length > 0) {
        upsertPharmacies(fromModuleCache);
      }

      const pending = uniqueCodes.filter(
        (code) => !pharmacyMapRef.current[code] && !PHARMACY_CACHE.has(code),
      );
      if (pending.length === 0) return;

      setIsLoadingPharmacies(true);
      try {
        const results = await Promise.all(
          pending.map((code) => fetchPharmacyByCode(code, { silent: true })),
        );
        upsertPharmacies(results);
      } finally {
        setIsLoadingPharmacies(false);
      }
    },
    [fetchPharmacyByCode, upsertPharmacies],
  );

  const buildQuickPreviewItems = useCallback(
    (payload: DutyCalendarResponse): QuickPreviewItem[] => {
      const draftItems: Array<
        Omit<QuickPreviewItem, "date"> & { date?: string }
      > = [
        {
          key: "today" as const,
          label: "Hoy",
          date: payload.today?.date,
          schedule: payload.today?.schedule || null,
          pharmacy: payload.today?.schedule?.pharmacy,
        },
        {
          key: "tomorrow" as const,
          label: "Manana",
          date: payload.tomorrow?.date,
          schedule: payload.tomorrow?.schedule || null,
          pharmacy: payload.tomorrow?.schedule?.pharmacy,
        },
        {
          key: "dayAfterTomorrow" as const,
          label: "Pasado manana",
          date: payload.dayAfterTomorrow?.date,
          schedule: payload.dayAfterTomorrow?.schedule || null,
          pharmacy: payload.dayAfterTomorrow?.schedule?.pharmacy,
        },
      ];

      return draftItems.filter(
        (item): item is QuickPreviewItem =>
          typeof item.date === "string" && item.date.length > 0,
      );
    },
    [],
  );

  const loadMonthData = useCallback(async () => {
    const from = toISODateOnly(startOfMonth(monthCursor));
    const to = toISODateOnly(endOfMonth(monthCursor));

    setIsLoadingMonth(true);
    setMonthError(null);

    try {
      const payload = await requestJson<DutyRangeResponse>(
        `/api/core/farmaciadeturno?from=${from}&to=${to}`,
      );
      const rows = Array.isArray(payload.rows) ? payload.rows : [];

      setMonthRows(rows);
      upsertPharmacies(rows.map((row) => row.pharmacy));
      await prefetchPharmacies(
        rows
          .filter((row) => !row.pharmacy && !!row.pharmacyCode)
          .map((row) => row.pharmacyCode),
      );
    } catch (error) {
      const message = toErrorMessage(
        error,
        "No se pudo cargar el calendario del mes.",
      );
      setMonthError(message);
      toast.error(message);
    } finally {
      setIsLoadingMonth(false);
    }
  }, [monthCursor, prefetchPharmacies, upsertPharmacies]);

  const loadQuickPreview = useCallback(async () => {
    setIsLoadingQuickPreview(true);
    try {
      const payload = await requestJson<DutyCalendarResponse>(
        "/api/core/farmaciadeturno/calendar",
      );
      const items = buildQuickPreviewItems(payload);

      setQuickPreview(items);
      upsertPharmacies(items.map((item) => item.schedule?.pharmacy));
      await prefetchPharmacies(
        items
          .filter((item) => !item.schedule?.pharmacy)
          .map((item) => item.schedule?.pharmacyCode)
          .filter(
            (code): code is string =>
              typeof code === "string" && code.length > 0,
          ),
      );
    } catch (error) {
      toast.error(toErrorMessage(error, "No se pudo cargar la vista rapida."));
    } finally {
      setIsLoadingQuickPreview(false);
    }
  }, [buildQuickPreviewItems, prefetchPharmacies, upsertPharmacies]);

  const loadBootstrapData = useCallback(async () => {
    const from = toISODateOnly(startOfMonth(monthCursor));
    const to = toISODateOnly(endOfMonth(monthCursor));
    const rangeKey = `${from}|${to}`;

    setIsLoadingMonth(true);
    setIsLoadingQuickPreview(true);
    setMonthError(null);

    try {
      const ifNoneMatch = bootstrapEtagRef.current[rangeKey];
      const bootstrapResponse =
        await requestJsonWithEtag<DutyBootstrapResponse>(
          `/api/core/farmaciadeturno/bootstrap?from=${from}&to=${to}`,
          ifNoneMatch
            ? {
                headers: {
                  "If-None-Match": ifNoneMatch,
                },
              }
            : undefined,
        );

      if (bootstrapResponse.etag) {
        bootstrapEtagRef.current[rangeKey] = bootstrapResponse.etag;
      }

      let payload = bootstrapResponse.payload;
      if (bootstrapResponse.status === 304) {
        payload = bootstrapCacheRef.current[rangeKey] || null;
      } else if (payload) {
        bootstrapCacheRef.current[rangeKey] = payload;
      }

      if (!payload) {
        throw new Error("No se pudo reconstruir bootstrap de farmacias.");
      }

      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const quickItems = buildQuickPreviewItems(payload.quickPreview);
      const payloadPharmacies = Array.isArray(payload.pharmacies)
        ? payload.pharmacies
        : [];

      setMonthRows(rows);
      setQuickPreview(quickItems);
      upsertPharmacies([
        ...payloadPharmacies,
        ...rows.map((row) => row.pharmacy),
        ...quickItems.map((item) => item.schedule?.pharmacy),
      ]);

      await prefetchPharmacies([
        ...rows
          .filter((row) => !row.pharmacy && !!row.pharmacyCode)
          .map((row) => row.pharmacyCode),
        ...quickItems
          .filter((item) => !item.schedule?.pharmacy)
          .map((item) => item.schedule?.pharmacyCode)
          .filter(
            (code): code is string =>
              typeof code === "string" && code.length > 0,
          ),
      ]);
    } catch (error) {
      const typedError = error as RequestError;
      const shouldUseCompatibilityFallback =
        typedError.status === 404 || typedError.status === 501;

      if (shouldUseCompatibilityFallback) {
        await Promise.all([loadMonthData(), loadQuickPreview()]);
        return;
      }

      const message = toErrorMessage(
        error,
        "No se pudo cargar bootstrap de farmacias de turno.",
      );
      setMonthError(message);
      toast.error(message);
    } finally {
      setIsLoadingMonth(false);
      setIsLoadingQuickPreview(false);
    }
  }, [
    buildQuickPreviewItems,
    loadMonthData,
    loadQuickPreview,
    monthCursor,
    prefetchPharmacies,
    upsertPharmacies,
  ]);

  useEffect(() => {
    void loadBootstrapData();
  }, [loadBootstrapData, reloadTick]);

  const assignmentMap = useMemo(
    () =>
      monthRows.reduce<Record<string, DutyAssignment>>((acc, row) => {
        acc[row.date] = row;
        return acc;
      }, {}),
    [monthRows],
  );

  const loadSelectedDuty = useCallback(
    async (date: Date) => {
      const dateKey = toISODateOnly(date);
      setIsLoadingSelectedDuty(true);

      try {
        const payload = await requestJson<DutyAssignment>(
          `/api/core/farmaciadeturno/${encodeURIComponent(dateKey)}`,
        );

        setSelectedDutyDetail(payload);
        setSelectedDutyPharmacyCode(payload.pharmacyCode || "");
        upsertPharmacies([payload.pharmacy]);

        const normalizedCode = payload.pharmacyCode?.toUpperCase();
        const shouldLookupPharmacy =
          !!normalizedCode &&
          !payload.pharmacy &&
          !pharmacyMapRef.current[normalizedCode] &&
          !PHARMACY_CACHE.has(normalizedCode);

        if (shouldLookupPharmacy && normalizedCode) {
          await fetchPharmacyByCode(normalizedCode, { silent: true });
        }
      } catch (error) {
        const typedError = error as RequestError;
        if (typedError.status === 404) {
          setSelectedDutyDetail(null);
          const row = assignmentMap[dateKey];
          if (row?.pharmacyCode) {
            setSelectedDutyPharmacyCode(row.pharmacyCode);
          }
          return;
        }

        toast.error(
          toErrorMessage(
            error,
            "No se pudo cargar el turno para la fecha seleccionada.",
          ),
        );
      } finally {
        setIsLoadingSelectedDuty(false);
      }
    },
    [assignmentMap, fetchPharmacyByCode, upsertPharmacies],
  );

  useEffect(() => {
    if (activeTab !== "duty") return;
    if (!selectedDutyDate) return;
    void loadSelectedDuty(selectedDutyDate);
  }, [activeTab, selectedDutyDate, loadSelectedDuty, reloadTick]);

  const availablePharmacyCodes = useMemo(() => {
    const codes = new Set<string>(Object.keys(pharmacyMap));

    monthRows.forEach((row) => {
      if (row.pharmacyCode) {
        codes.add(row.pharmacyCode.toUpperCase());
      }
    });

    quickPreview.forEach((item) => {
      if (item.schedule?.pharmacyCode) {
        codes.add(item.schedule.pharmacyCode.toUpperCase());
      }
    });

    if (selectedDutyDetail?.pharmacyCode) {
      codes.add(selectedDutyDetail.pharmacyCode.toUpperCase());
    }

    return Array.from(codes).sort((a, b) => a.localeCompare(b));
  }, [monthRows, pharmacyMap, quickPreview, selectedDutyDetail]);

  useEffect(() => {
    if (selectedDutyPharmacyCode) return;
    if (availablePharmacyCodes.length > 0) {
      setSelectedDutyPharmacyCode(availablePharmacyCodes[0]);
    }
  }, [availablePharmacyCodes, selectedDutyPharmacyCode]);

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(monthCursor),
        end: endOfMonth(monthCursor),
      }),
    [monthCursor],
  );

  const pharmacies = useMemo(
    () =>
      Object.values(pharmacyMap).sort((a, b) =>
        `${a.name} ${a.code}`.localeCompare(`${b.name} ${b.code}`),
      ),
    [pharmacyMap],
  );

  const filteredPharmacies = useMemo(() => {
    const search = pharmacySearch.trim().toLowerCase();
    if (!search) return pharmacies;

    return pharmacies.filter((pharmacy) => {
      const source =
        `${pharmacy.code} ${pharmacy.name} ${pharmacy.address} ${pharmacy.phone}`.toLowerCase();
      return source.includes(search);
    });
  }, [pharmacies, pharmacySearch]);

  const currentSelectedPharmacy = selectedDutyDetail?.pharmacyCode
    ? pharmacyMap[selectedDutyDetail.pharmacyCode.toUpperCase()] ||
      selectedDutyDetail.pharmacy
    : selectedDutyPharmacyCode
    ? pharmacyMap[selectedDutyPharmacyCode.toUpperCase()]
    : undefined;

  const handleQuickEditDay = useCallback((day: Date, pharmacyCode?: string) => {
    setSelectedDutyDate(new Date(day));
    if (pharmacyCode) {
      setSelectedDutyPharmacyCode(pharmacyCode.toUpperCase());
    }
    setActiveTab("duty");
    toast.message(
      `Editando turno del ${format(day, "PPP", { locale: es })}${
        pharmacyCode ? ` (${pharmacyCode.toUpperCase()})` : ""
      }.`,
    );
  }, []);

  const handleApplyDutyChange = useCallback(async () => {
    if (!selectedDutyDate || !selectedDutyPharmacyCode) {
      toast.error("Selecciona fecha y farmacia.");
      return;
    }

    const dateKey = toISODateOnly(selectedDutyDate);
    setIsSavingDuty(true);

    try {
      const payload = await requestJson<DutyAssignment>(
        `/api/core/farmaciadeturno/${encodeURIComponent(dateKey)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pharmacyCode: selectedDutyPharmacyCode,
          }),
        },
      );

      setSelectedDutyDetail(payload);
      upsertPharmacies([payload.pharmacy]);

      const normalizedCode = payload.pharmacyCode?.toUpperCase();
      const shouldLookupPharmacy =
        !!normalizedCode &&
        !payload.pharmacy &&
        !pharmacyMapRef.current[normalizedCode] &&
        !PHARMACY_CACHE.has(normalizedCode);

      if (shouldLookupPharmacy && normalizedCode) {
        await fetchPharmacyByCode(normalizedCode, { silent: true });
      }
      setReloadTick((current) => current + 1);

      toast.success(
        `Turno actualizado para ${format(selectedDutyDate, "PPP", {
          locale: es,
        })}.`,
      );
    } catch (error) {
      toast.error(toErrorMessage(error, "No se pudo actualizar el turno."));
    } finally {
      setIsSavingDuty(false);
    }
  }, [
    fetchPharmacyByCode,
    selectedDutyDate,
    selectedDutyPharmacyCode,
    upsertPharmacies,
  ]);

  const handleLookupPharmacy = useCallback(async () => {
    const code = pharmacyLookupCode.trim().toUpperCase();
    if (!code) {
      toast.error("Ingresa un codigo de farmacia.");
      return;
    }

    setIsLookupLoading(true);
    try {
      const pharmacy = await fetchPharmacyByCode(code);
      if (!pharmacy) return;
      setPharmacyLookupCode(pharmacy.code);
      toast.success(`Farmacia ${pharmacy.code} cargada.`);
    } finally {
      setIsLookupLoading(false);
    }
  }, [fetchPharmacyByCode, pharmacyLookupCode]);

  const openEditPharmacyDialog = useCallback((pharmacy: Pharmacy) => {
    setEditingPharmacy({ ...pharmacy });
    setIsPharmacyDialogOpenState(true);
    toast.message(`Editando farmacia ${pharmacy.code.toUpperCase()}.`);
  }, []);

  const updateEditingPharmacy = useCallback((partial: Partial<Pharmacy>) => {
    setEditingPharmacy((current) =>
      current ? { ...current, ...partial } : current,
    );
  }, []);

  const handleSavePharmacy = useCallback(async () => {
    if (!editingPharmacy) return;

    const normalizedCode = editingPharmacy.code.trim().toUpperCase();
    const normalizedName = editingPharmacy.name.trim();
    const normalizedAddress = editingPharmacy.address.trim();
    const normalizedPhone = editingPharmacy.phone.trim();

    if (
      !normalizedCode ||
      !normalizedName ||
      !normalizedAddress ||
      !normalizedPhone
    ) {
      toast.error("Codigo, nombre, direccion y telefono son obligatorios.");
      return;
    }

    setIsSavingPharmacy(true);
    try {
      const payload = await requestJson<Pharmacy>(
        `/api/core/pharmacy/${encodeURIComponent(normalizedCode)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            address: normalizedAddress,
            phone: normalizedPhone,
            lat: editingPharmacy.lat,
            lng: editingPharmacy.lng,
            googleMapsAddress:
              editingPharmacy.googleMapsAddress?.trim() || null,
          }),
        },
      );

      upsertPharmacies([payload]);
      setEditingPharmacy(null);
      setIsPharmacyDialogOpenState(false);
      setReloadTick((current) => current + 1);
      toast.success(`Farmacia ${normalizedCode} actualizada.`);
    } catch (error) {
      toast.error(toErrorMessage(error, "No se pudo actualizar la farmacia."));
    } finally {
      setIsSavingPharmacy(false);
    }
  }, [editingPharmacy, upsertPharmacies]);

  const setIsPharmacyDialogOpen = useCallback((value: boolean) => {
    setIsPharmacyDialogOpenState(value);
    if (!value) {
      setEditingPharmacy(null);
    }
  }, []);

  const monthTitle = format(monthCursor, "MMMM yyyy", { locale: es });
  const selectedDateTitle = selectedDutyDate
    ? format(selectedDutyDate, "EEEE d 'de' MMMM yyyy", { locale: es })
    : "";

  const onPrevMonth = useCallback(() => {
    setMonthCursor((prev) => {
      const next = subMonths(prev, 1);
      toast.message(`Mostrando ${format(next, "MMMM yyyy", { locale: es })}.`);
      return next;
    });
  }, []);

  const onNextMonth = useCallback(() => {
    setMonthCursor((prev) => {
      const next = addMonths(prev, 1);
      toast.message(`Mostrando ${format(next, "MMMM yyyy", { locale: es })}.`);
      return next;
    });
  }, []);

  const onCurrentMonth = useCallback(() => {
    const currentMonth = startOfMonth(new Date());
    setMonthCursor(currentMonth);
    toast.message(
      `Volviste a ${format(currentMonth, "MMMM yyyy", { locale: es })}.`,
    );
  }, []);

  const onReload = useCallback(() => {
    setReloadTick((current) => current + 1);
    toast.message("Actualizando calendario y turnos...");
  }, []);

  return {
    activeTab,
    setActiveTab,
    monthTitle,
    monthDays,
    assignmentMap,
    pharmacyMap,
    quickPreview,
    isLoadingMonth,
    isLoadingQuickPreview,
    isLoadingPharmacies,
    monthError,
    onPrevMonth,
    onNextMonth,
    onCurrentMonth,
    onReload,
    selectedDutyDate,
    setSelectedDutyDate,
    selectedDutyPharmacyCode,
    setSelectedDutyPharmacyCode,
    availablePharmacyCodes,
    isLoadingSelectedDuty,
    isSavingDuty,
    selectedDutyDetail,
    selectedDateTitle,
    currentSelectedPharmacy,
    handleQuickEditDay,
    handleApplyDutyChange,
    pharmacySearch,
    setPharmacySearch,
    pharmacyLookupCode,
    setPharmacyLookupCode,
    isLookupLoading,
    handleLookupPharmacy,
    filteredPharmacies,
    isPharmacyDialogOpen,
    setIsPharmacyDialogOpen,
    editingPharmacy,
    openEditPharmacyDialog,
    updateEditingPharmacy,
    handleSavePharmacy,
    isSavingPharmacy,
  };
}
