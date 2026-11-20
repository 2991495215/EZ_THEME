import request from './request';


export function fetchOrderList() {
  return request({
    url: '/user/order/fetch',
    method: 'get'
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching order list:', error);
    throw error;
  });
}


export function cancelOrder(tradeNo) {
  return request({
    url: '/user/order/cancel',
    method: 'post',
    data: { trade_no: tradeNo }
  });
}
