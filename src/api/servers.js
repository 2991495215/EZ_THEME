import request from './request';


export function fetchServerNodes() {
  return request({
    url: '/user/server/fetch',
    method: 'get',
    params: {
      _t: Date.now()
    }
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching server nodes:', error);
    throw error;
  });
} 

export function fetchNodeMachine(nodeId, options = {}) {
  return request({
    url: '/user/server/machine',
    method: 'get',
    params: {
      node_id: nodeId,
      history_limit: options.historyLimit || 60,
      range_hours: options.rangeHours || 24,
      _t: Date.now()
    }
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }

    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching node machine:', error);
    throw error;
  });
}
