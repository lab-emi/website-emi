export const site = {
  name: 'EMI Lab', fullName: 'Lab of Efficient Machine Intelligence',
  description: 'Led by Dr. Chang Gao, the Efficient Machine Intelligence lab at TU Delft develops algorithms and hardware for energy-efficient edge AI, intelligent radio systems and neuromorphic sensing.',
  email: 'chang.gao@tudelft.nl',
  github: 'https://github.com/lab-emi',
  scholar: 'https://scholar.google.com/citations?user=sQ9N7dsAAAAJ&hl=en',
};

export function href(path = '/') {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export const thumb = (path: string) => href(path.replace('/images/', '/images/thumbs/'));
export const dateLabel = (date: Date | string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const localizeHtml = (html: string) => html.replace(/(href|src)="\/(?!\/)([^\"]*)"/g, (_, attr, path) => `${attr}="${href('/' + path)}"`);
export const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
