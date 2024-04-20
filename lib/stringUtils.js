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
