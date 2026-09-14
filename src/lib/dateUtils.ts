export function parseLocalDate(dateVal: string | Date | null | undefined): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === "string") {
        // If string is YYYY-MM-DD (10 chars), add T12:00:00 to prevent UTC midnight timezone rollback in Brazil (UTC-3)
        if (dateVal.length === 10 && dateVal.includes("-")) {
            return new Date(dateVal + "T12:00:00");
        }
    }
    return new Date(dateVal);
}

export function formatDateBR(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return "";
    const d = parseLocalDate(dateVal);
    return d.toLocaleDateString("pt-BR");
}

