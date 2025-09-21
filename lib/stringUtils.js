export function truncateAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function getContractFromUid(uid) {
  return uid.split("-").shift();
}

export function getIdFromUid(uid) {
  return uid.split("-").pop();
}

export function getUrlFromUid(uid) {
  return uid.replace("-", "/");
}

export function getAkaswapAssetUrl(thumbnailUri) {
  return `https://assets.akaswap.com/ipfs/${thumbnailUri.replace("ipfs://", "")}`;
}

// 新增日期格式化函數
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${month}/${day}/${year}`;
}

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function formatTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}
