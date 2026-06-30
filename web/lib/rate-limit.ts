/**
 * 简易内存速率限制器（适合单机私有部署）。
 * 生产环境高并发场景建议替换为 Redis 或 Upstash 等方案。
 */

const store = new Map<string, { count: number; resetAt: number }>();

// 每 10 分钟清理一次过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000).unref();

/**
 * @param key 标识符（如 IP + 端点）
 * @param maxAttempts 窗口内最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @returns 是否超限
 */
export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}
