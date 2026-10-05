import request from './request';


export function fetchKnowledgeList(language, options = {}) {
  return request({
    url: `/${localStorage.getItem('token') ? 'user' : 'guest'}/knowledge/fetch?language=${language}`,
    method: 'get',
    signal: options.signal
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching knowledge list:', error);
    throw error;
  });
}


export function fetchKnowledgeDetail(id, language, options = {}) {
  return request({
    url: `/${localStorage.getItem('token') ? 'user' : 'guest'}/knowledge/fetch?id=${id}&language=${language}`,
    method: 'get',
    signal: options.signal
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching knowledge detail:', error);
    throw error;
  });
}

