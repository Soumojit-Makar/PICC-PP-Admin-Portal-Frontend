export interface Country {
    active: boolean;
    countryCode: string;
    countryId: string;
    createdBy?: string | null;
    createdOn?: string;
    currency?: string;
    modifiedBy?: string | null;
    modifiedOn?: string | null;
    setupCharge?: string;
    taxComment?: string;
    taxCountry?: string;
    taxRegion?: string;
    taxPct?: string;
    taxType?: string;
}