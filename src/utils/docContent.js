import DOMPurify from 'dompurify';

// Support old copy/jump buttons as data, never as executable inline JavaScript.
export const sanitizeDocContent = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('[onclick]').forEach(element => {
    const action = element.getAttribute('onclick').trim();
    if (/^(?:copy\((['"])[^'"]*\1\)|jump\(\d+\));?$/.test(action)) {
      element.setAttribute('data-original-onclick', action);
    }
    element.removeAttribute('onclick');
  });
  template.content.querySelectorAll('[data-href]').forEach(element => {
    if (!/^(?:https?:\/\/|\/(?!\/)|\.{1,2}\/|#)/i.test(element.dataset.href)) {
      element.removeAttribute('data-href');
    }
  });
  return DOMPurify.sanitize(template.innerHTML, {
    FORBID_TAGS: ['script', 'style', 'link', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['srcdoc'],
    ALLOW_UNKNOWN_PROTOCOLS: false
  });
};
