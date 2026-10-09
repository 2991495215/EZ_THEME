

const trafficCache = new Map();

const nodeFlags = import.meta.glob('../assets/i18N/*.svg', { eager: true, query: '?url', import: 'default' });

export function formatNodeName(name = '') {
    const prefix = name.match(/^(?:([\u{1F1E6}-\u{1F1FF}]{2})|([A-Za-z]{2})(?=\s))/u);
    const code = prefix?.[1]
        ? [...prefix[1]].map(char => String.fromCharCode(char.codePointAt(0) - 0x1F1E6 + 65)).join('')
        : prefix?.[2]?.toUpperCase();
    const flag = nodeFlags[`../assets/i18N/${code}.svg`];
    return { flag, label: flag ? name.slice(prefix[0].length).trimStart() : name };
}

const MAX_CACHE_SIZE = 100;

// 2026-10-09 IPv4 上海三网回程笔记；CN2 不代表 GIA，S16 电信为 163＋CN2 混合路径。
const nodeRouteTags = { 12: ['CN2', 'CMIN2'], 16: ['CN2', '9929', 'CMIN2'] };

export function formatNodeTags(node) {
    const server = formatNodeName(node.name).label.match(/^美国S(12|16)(?=$|[\s｜|])/i)?.[1];
    return [...new Set([...(node.tags || []), ...(nodeRouteTags[server] || [])])];
}





export function formatTraffic(bytes) {

    if (bytes === 0) return '0 B';



    if (trafficCache.has(bytes)) {

        return trafficCache.get(bytes);

    }



    const k = 1024;

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const result = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];



    if (trafficCache.size >= MAX_CACHE_SIZE) {

        const firstKey = trafficCache.keys().next().value;

        trafficCache.delete(firstKey);

    }

    trafficCache.set(bytes, result);



    return result;

}





const dateCache = new Map();





export function formatDate(date, withTime = false) {

    if (!date) return '--';



    const cacheKey = `${date}_${withTime}`;



    if (dateCache.has(cacheKey)) {

        return dateCache.get(cacheKey);

    }



    let dateObj = date;

    if (typeof date === 'number') {

        dateObj = new Date(date * 1000);

    }



    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {

        console.error('Invalid date:', date);

        return '--';

    }



    const options = {

        year: 'numeric',

        month: '2-digit',

        day: '2-digit'

    };



    if (withTime) {

        options.hour = '2-digit';

        options.minute = '2-digit';

        options.second = '2-digit';

        options.hour12 = false;

    }



    let result;

    try {

        result = new Intl.DateTimeFormat('zh-CN', options).format(dateObj);

    } catch(e) {

        const pad = (num) => String(num).padStart(2, '0');



        const year = dateObj.getFullYear();

        const month = pad(dateObj.getMonth() + 1);

        const day = pad(dateObj.getDate());



        if (withTime) {

            const hours = pad(dateObj.getHours());

            const minutes = pad(dateObj.getMinutes());

            const seconds = pad(dateObj.getSeconds());

            result = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        } else {

            result = `${year}-${month}-${day}`;

        }

    }



    if (dateCache.size >= MAX_CACHE_SIZE) {

        const firstKey = dateCache.keys().next().value;

        dateCache.delete(firstKey);

    }

    dateCache.set(cacheKey, result);



    return result;

}





export function formatUserInfoForTicket(userInfo, ipInfo, userSubscribe = null) {

    const userData = userInfo.data ? userInfo.data : userInfo;

    const ipData = ipInfo.data ? ipInfo.data : ipInfo;

    const subscribeData = userSubscribe ? (userSubscribe.data ? userSubscribe.data : userSubscribe) : null;



    const uData = typeof userData === 'object' && userData !== null ? userData : {};

    const iData = typeof ipData === 'object' && ipData !== null ? ipData : {};

    const sData = typeof subscribeData === 'object' && subscribeData !== null ? subscribeData : {};



    const ipAddress = iData.ip || '--';



    let location = '';



    if (Array.isArray(iData.location)) {
        // myip.ipip.net 格式: [国家, 省份, 城市, 区县, 运营商]
        location = iData.location.filter(item => item && item.trim()).join(' ');
    } else if (iData.country) {

        location += iData.country;

        if (iData.region) location += ' ' + iData.region;

        if (iData.city) location += ' ' + iData.city;

    }

    else if (iData.prov) {

        if (iData.country) location += iData.country;

        location += ' ' + iData.prov;

        if (iData.city) location += ' ' + iData.city;

        if (iData.district) location += ' ' + iData.district;

    }



    let planName = "未知套餐";

    if (sData && sData.plan && sData.plan.name) {

        planName = sData.plan.name;

    } else if (uData.plan_id) {

        planName = `ID: ${uData.plan_id}`;

    }



    if (planName === "未知套餐" || planName.startsWith("ID:")) {

        if (uData.plan_name && uData.plan_name.trim() !== '') {

            planName = uData.plan_name;

        } else if (uData.group && uData.group.name && uData.group.name.trim() !== '') {

            planName = uData.group.name;

        }

    }



    let expireDate = formatDate(sData.expired_at || uData.expired_at);



    let currencySymbol = '¥';
    if (userInfo.currency_symbol) {

        currencySymbol = userInfo.currency_symbol;

    } else if (userInfo.data && userInfo.data.currency_symbol) {

        currencySymbol = userInfo.data.currency_symbol;

    }



    let transferEnable = 0;

    let usedU = 0;

    let usedD = 0;



    if (sData) {

        transferEnable = sData.transfer_enable || 0;

        usedU = sData.u || 0;

        usedD = sData.d || 0;

    } else {

        transferEnable = uData.transfer_enable || 0;

        usedU = uData.u || 0;

        usedD = uData.d || 0;

    }



    const remainingTraffic = transferEnable - (usedU + usedD);



    return `

-------------

用户信息

注册时间：${formatDate(uData.created_at)}

套餐名称：${planName}

到期时间：${expireDate}

剩余流量：${formatTraffic(remainingTraffic > 0 ? remainingTraffic : 0)}

已使用流量：${formatTraffic(usedU + usedD)}

用户余额：${((uData.balance || 0) / 100).toFixed(2)} ${currencySymbol}

创建工单时的IP：${ipAddress}

创建工单的位置：${location || '--'}

-------------

`;

}
