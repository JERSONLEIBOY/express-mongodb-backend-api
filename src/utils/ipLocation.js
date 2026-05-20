const geoip = require('geoip-lite');

// 内网 / 本地回环判断
const isPrivateIP = (ip) => {
  if (!ip) return true;
  const v = ip.replace(/^::ffff:/, ''); // 去掉 IPv4-mapped IPv6 前缀
  if (v === '::1' || v === '127.0.0.1' || v === 'localhost') return true;
  if (v.startsWith('10.')) return true;
  if (v.startsWith('192.168.')) return true;
  // 172.16.0.0 - 172.31.255.255
  const m = v.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (v.startsWith('fc') || v.startsWith('fd')) return true; // IPv6 私网
  return false;
};

const COUNTRY_NAME = {
  CN: '中国', US: '美国', JP: '日本', KR: '韩国', GB: '英国',
  DE: '德国', FR: '法国', RU: '俄罗斯', IN: '印度', HK: '中国香港',
  TW: '中国台湾', SG: '新加坡', CA: '加拿大', AU: '澳大利亚'
};

const lookupLocation = (ip) => {
  if (!ip) return '未知';
  if (isPrivateIP(ip)) return '内网IP';
  const v = ip.replace(/^::ffff:/, '');
  const r = geoip.lookup(v);
  if (!r) return '未知';
  const country = COUNTRY_NAME[r.country] || r.country || '';
  const region = r.city || r.region || '';
  return region ? `${country} ${region}`.trim() : country || '未知';
};

module.exports = { lookupLocation, isPrivateIP };
