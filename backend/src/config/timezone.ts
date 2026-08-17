// Pin the process timezone to the clinic's zone so that day/month/quarter
// boundaries computed with `new Date(y, m, d)` in the dashboards match the cron
// (which uses Asia/Tashkent explicitly) and the clinic wall-clock — regardless
// of the host TZ (cloud/Docker hosts default to UTC, which is +5h off).
// Imported first in server.ts so it runs before any module does date math.
process.env.TZ = process.env.TZ || 'Asia/Tashkent';
