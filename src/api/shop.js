import request from './request';


export function fetchPlans() {
  return request({
    url: `/${localStorage.getItem('token') ? 'user' : 'guest'}/plan/fetch?pricing_quote=1`,
    method: 'get'
  });
}


export function getCommConfig() {
  return request({
    url: `/${localStorage.getItem('token') ? 'user' : 'guest'}/comm/config`,
    method: 'get'
  });
}


export function fetchPlanById(id) {
  return request({
    url: `/${localStorage.getItem('token') ? 'user' : 'guest'}/plan/fetch?pricing_quote=1&id=${id}`,
    method: 'get'
  });
}


export function verifyCoupon(code, planId, period) {
  return request({
    url: '/user/coupon/check',
    method: 'post',
    data: {
      code: code,
      plan_id: planId,
      period,
      pricing_quote: true
    }
  });
}


export function submitOrder(data) {
  return request({
    url: '/user/order/save',
    method: 'post',
    data
  });
}


export function getOrderDetail(tradeNo) {
  return request({
    url: `/user/order/detail?trade_no=${tradeNo}`,
    method: 'get'
  });
}


export function getPaymentMethods(tradeNo) {
  return request({
    url: '/user/order/getPaymentMethod'+(tradeNo ? '?trade_no='+encodeURIComponent(tradeNo) : ''),
    method: 'get'
  });
}


export function checkOrderStatus(tradeNo) {
  return request({
    url: `/user/order/check?trade_no=${tradeNo}`,
    method: 'get'
  });
}


export function cancelOrder(tradeNo) {
  return request({
    url: '/user/order/cancel',
    method: 'post',
    data: {
      trade_no: tradeNo
    }
  });
}


export function checkoutOrder(tradeNo, method) {
  return request({
    url: '/user/order/checkout',
    method: 'post',
    data: {
      trade_no: tradeNo,
      method: method?.id,
      charge_amount: method?.charge_amount,
      charge_currency: method?.charge_currency
    }
  });
}

