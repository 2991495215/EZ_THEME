import DOMPurify from 'dompurify';

const htmlConfig = {
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

const svgConfig = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

const normalizeHtml = value => {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return String(value);
};

export const sanitizeHtml = value => DOMPurify.sanitize(normalizeHtml(value), htmlConfig);

export const sanitizeSvg = value => DOMPurify.sanitize(normalizeHtml(value), svgConfig);

export const sanitizeUrl = value => {
  const url = normalizeHtml(value).trim();

  if (!url) {
    return '';
  }

  if (/^(https?:|mailto:|tel:|\/)/i.test(url)) {
    return url;
  }

  return '';
};
