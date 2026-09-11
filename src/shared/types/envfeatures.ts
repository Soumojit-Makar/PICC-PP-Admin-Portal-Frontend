export interface ChildElementDtl {
  chElementDtlId: string;
  elementDtlName: string;
  elementDtlType: string;
  elementDtlHome: string;
  elementDtlDesc: string;
  elementDtlURL?: string;
  elementDtlFatNo: string;
  demoUrl: string;
  // componentType: string;
  elementDtlSeq: string;
  isAssigned: boolean;
  elementId: string;
};

export interface ElementDetail {
  elementDtlId: string;
  elementDtlName: string;
  elementDtlType: string;
  elementDtlHome: string;
  elementDtlDesc: string;
  elementDtlURL: string;
  elementDtlFatNo: string;
  elementDtlSeq: string;
  childElementDtls?: ChildElementDtl[];
  isAssigned: boolean;
};

export interface FeatureElement {
  elementId: string;
  elementName: string;
  elementType: string;
  elementDesc: string;
  elementPage: string;
  feaSeq: string;
  elementDetails?: ElementDetail[];
  isAssigned: boolean;
};

export interface EnvFeature {
  feaId: string;
  feaName: string;
  featureElements?: FeatureElement[];
  feaSeq: string,
  feaDesc: string,
  feaType: string,
  isAssigned: boolean
  id: string | number,
};