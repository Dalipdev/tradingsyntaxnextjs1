const months = Object.freeze(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]);
const days = Object.freeze(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]);
const monthsFull = Object.freeze([
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]);

export const getDay = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
};

export const getFullDay = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const getDayName = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return days[date.getUTCDay()];
};

export const getFullDayWithName = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return `${days[date.getUTCDay()]}, ${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const getBlogDateFormat = (timestamp, readingTime) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const formattedDate = `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  return readingTime ? `${formattedDate} · ${readingTime} min read` : formattedDate;
};

export const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffInMs = now - date;
  if (diffInMs < 0) return "In the future";
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours   = Math.floor(diffInMinutes / 60);
  const diffInDays    = Math.floor(diffInHours / 24);
  const diffInWeeks   = Math.floor(diffInDays / 7);
  const diffInMonths  = Math.floor(diffInDays / 30);
  const diffInYears   = Math.floor(diffInDays / 365);
  if (diffInSeconds < 60)  return "Just now";
  if (diffInMinutes < 60)  return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  if (diffInHours < 24)    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffInDays < 7)      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  if (diffInWeeks < 4)     return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  if (diffInMonths < 12)   return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

export const getSmartDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffInDays < 7)   return getRelativeTime(timestamp);
  if (diffInDays < 365) return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

export const getISODate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

export const getInputDateFormat = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const year  = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const date  = new Date(timestamp);
  const today = new Date();
  return date.getUTCDate()     === today.getUTCDate()
      && date.getUTCMonth()    === today.getUTCMonth()
      && date.getUTCFullYear() === today.getUTCFullYear();
};

export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const date      = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return date.getUTCDate()     === yesterday.getUTCDate()
      && date.getUTCMonth()    === yesterday.getUTCMonth()
      && date.getUTCFullYear() === yesterday.getUTCFullYear();
};

export const getSEODate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

export { months, monthsFull, days };