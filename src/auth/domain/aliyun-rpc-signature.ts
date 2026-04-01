import { createHmac, randomUUID } from 'crypto';

const encode = (value: string) =>
  encodeURIComponent(value)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');

export const buildAliyunRpcQuery = (
  accessKeyId: string,
  accessKeySecret: string,
  action: string,
  version: string,
  params: Record<string, string>,
) => {
  const query: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: action,
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString(),
    Version: version,
    ...params,
  };

  const canonicalizedQueryString = Object.keys(query)
    .sort()
    .map((key) => `${encode(key)}=${encode(query[key] ?? '')}`)
    .join('&');

  const stringToSign = `GET&${encode('/')}&${encode(canonicalizedQueryString)}`;
  const signature = createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');

  return new URLSearchParams({
    ...query,
    Signature: signature,
  }).toString();
};
