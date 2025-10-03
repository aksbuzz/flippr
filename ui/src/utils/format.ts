import { default as dayjs } from 'dayjs';

export const formatDate = (date: Date) => dayjs(date).format('D MMM, YYYY h:mm A');
