export interface Config {
  ORGANIZATION: string,
  page: number,
  perPage: number,
  pageSize: number,
  tabs: { [key: string]: string },
}
