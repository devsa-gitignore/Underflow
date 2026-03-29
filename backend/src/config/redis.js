const DEFAULT_REDIS_PORT = 6379;

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fromRedisUrl(redisUrl) {
  try {
    const parsed = new URL(redisUrl);

    if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
      return {
        enabled: false,
        reason: 'REDIS_URL must start with redis:// or rediss://',
      };
    }

    const connection = {
      host: parsed.hostname,
      port: toNumber(parsed.port, DEFAULT_REDIS_PORT),
    };

    if (parsed.username) {
      connection.username = decodeURIComponent(parsed.username);
    }

    if (parsed.password) {
      connection.password = decodeURIComponent(parsed.password);
    }

    if (parsed.protocol === 'rediss:') {
      connection.tls = {};
    }

    return { enabled: true, connection, source: 'REDIS_URL' };
  } catch {
    return {
      enabled: false,
      reason: 'REDIS_URL is invalid',
    };
  }
}

export function getRedisConnectionConfig() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    return fromRedisUrl(redisUrl);
  }

  const redisHost = process.env.REDIS_HOST?.trim();
  if (redisHost) {
    return {
      enabled: true,
      source: 'REDIS_HOST',
      connection: {
        host: redisHost,
        port: toNumber(process.env.REDIS_PORT, DEFAULT_REDIS_PORT),
      },
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    return {
      enabled: true,
      source: 'local-default',
      connection: {
        host: '127.0.0.1',
        port: DEFAULT_REDIS_PORT,
      },
    };
  }

  return {
    enabled: false,
    reason: 'Redis is disabled: set REDIS_URL (preferred) or REDIS_HOST in production.',
  };
}
