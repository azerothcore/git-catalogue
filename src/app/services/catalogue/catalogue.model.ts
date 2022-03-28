export interface Config {
  organization: string;
  page: number;
  perPage: number;
  pageSize: number;
  tabs: { [key: string]: string };
}
