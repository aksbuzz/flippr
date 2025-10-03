export const okResponse = (data: any) => ({ data, status: 'OK' });
export const errorResponse = (error: string) => ({ error, status: 'ERROR' });
