export interface NavItemType {
  label: string
  path?: string
  baseroute:string
  submenu?: { label: string, path: string,route:string }[]
}