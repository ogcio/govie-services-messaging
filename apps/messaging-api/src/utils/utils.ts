export type ServiceError = { error: object; msg: string; critical: boolean };

export const utils = {
  postgresArrayify: function postgresArrayify(arr: unknown[]): string {
    return JSON.stringify(arr).replace("[", "{").replace("]", "}");
  },
};
