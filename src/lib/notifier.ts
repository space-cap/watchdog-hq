import crypto from 'crypto';
import { queryDB, memoryStore } from './db';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE || '';
const SOLAPI_ALIMTALK_PFID = process.env.SOLAPI_ALIMTALK_PFID || '';

/**
 * Send Slack Incoming Webhook Notification
 */
export async function sendSlackNotification(
  webhookUrl: string,
  targetName: string,
  targetUrl: string,
  isOnline: boolean,
  statusCode: number,
  latencyMs: number,
  errorMsg?: string
): Promise<boolean> {
  try {
    const title = isOnline
      ? `✅ [watchdog-hq] 서비스 정상 복구: ${targetName}`
      : `🚨 [watchdog-hq] 서비스 장애 발생: ${targetName}`;

    const color = isOnline ? '#10B981' : '#FF2E93';

    const payload = {
      attachments: [
        {
          color,
          title,
          title_link: targetUrl !== 'Hidden (Admin Only)' ? targetUrl : undefined,
          fields: [
            { title: '대상 URL', value: targetUrl, short: true },
            { title: '상태', value: isOnline ? 'ONLINE (정상)' : 'OFFLINE (장애)', short: true },
            { title: '응답 코드', value: statusCode > 0 ? String(statusCode) : '연결 실패', short: true },
            { title: '응답 속도', value: `${latencyMs}ms`, short: true },
          ],
          text: errorMsg ? `*원인:* \`${errorMsg}\`` : undefined,
          footer: 'watchdog-hq 실시간 가용성 관제 센터',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Slack webhook dispatch failed:', err);
    return false;
  }
}

/**
 * Send Discord Incoming Webhook Notification
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  targetName: string,
  targetUrl: string,
  isOnline: boolean,
  statusCode: number,
  latencyMs: number,
  errorMsg?: string
): Promise<boolean> {
  try {
    const color = isOnline ? 0x10b981 : 0xff2e93;
    const title = isOnline
      ? `✅ [watchdog-hq] 복구: ${targetName}`
      : `🚨 [watchdog-hq] 장애: ${targetName}`;

    const payload = {
      embeds: [
        {
          title,
          color,
          fields: [
            { name: '대상 URL', value: targetUrl, inline: true },
            { name: '상태', value: isOnline ? 'ONLINE' : 'OFFLINE', inline: true },
            { name: '응답 속도', value: `${latencyMs}ms`, inline: true },
            { name: '응답 코드', value: statusCode > 0 ? String(statusCode) : 'Err', inline: true },
            ...(errorMsg ? [{ name: '오류 상세', value: errorMsg }] : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Discord webhook dispatch failed:', err);
    return false;
  }
}

/**
 * Helper to generate Solapi HMAC-SHA256 Authorization Header
 */
function getSolapiAuthHeader(): string | null {
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) return null;

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', SOLAPI_API_SECRET)
    .update(date + salt)
    .digest('hex');

  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * Send Kakao Alimtalk & SMS via Solapi API
 */
export async function sendSolapiNotification(
  toPhone: string,
  targetName: string,
  isOnline: boolean,
  statusCode: number,
  errorMsg?: string
): Promise<boolean> {
  const authHeader = getSolapiAuthHeader();
  if (!authHeader || !SOLAPI_SENDER_PHONE) {
    console.log(`[Notifier] Solapi API credentials not configured. Skipping SMS/Kakao to ${toPhone}`);
    return false;
  }

  const cleanPhone = toPhone.replace(/[^0-9]/g, '');
  const statusStr = isOnline ? '정상 복구' : '접속 장애 발생';
  const text = `[watchdog-hq 알림]\n\n등록하신 '${targetName}' 서비스의 상태가 [${statusStr}]되었습니다.\n\n- 상태코드: ${statusCode}\n- 발생시각: ${new Date().toLocaleTimeString()}\n${errorMsg ? `- 원인: ${errorMsg}` : ''}`;

  try {
    const payload: any = {
      message: {
        to: cleanPhone,
        from: SOLAPI_SENDER_PHONE.replace(/[^0-9]/g, ''),
        text,
      },
    };

    // If Kakao PFID is provided, attach Kakao Alimtalk options
    if (SOLAPI_ALIMTALK_PFID) {
      payload.message.kakaoOptions = {
        pfId: SOLAPI_ALIMTALK_PFID,
      };
    }

    const res = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return res.ok;
  } catch (err) {
    console.error('Solapi notification failed:', err);
    return false;
  }
}

/**
 * Central Alert Dispatcher: Queries channels for the user/target and sends notifications
 */
export async function dispatchAlerts(
  targetId: number,
  targetName: string,
  targetUrl: string,
  isOnline: boolean,
  statusCode: number,
  latencyMs: number,
  errorMsg?: string,
  userId?: string
) {
  console.log(
    `[Alert Dispatcher] Triggering alert for target ID ${targetId} (${targetName}): ${
      isOnline ? 'ONLINE (RECOVERED)' : 'OFFLINE (DOWN)'
    }`
  );

  let channels: any[] = [];

  // Query channels from PostgreSQL if userId is present
  try {
    if (userId) {
      channels = await queryDB(
        'SELECT channel_type, destination FROM alert_channels WHERE user_id = $1 AND is_verified = true',
        [userId]
      );
    } else {
      channels = await queryDB(
        'SELECT channel_type, destination FROM alert_channels WHERE is_verified = true'
      );
    }
  } catch {
    // Memory store fallback channel check
    channels = memoryStoreAlertChannels;
  }

  for (const ch of channels) {
    const { channel_type, destination } = ch;
    if (!destination) continue;

    if (channel_type === 'slack') {
      sendSlackNotification(
        destination,
        targetName,
        targetUrl,
        isOnline,
        statusCode,
        latencyMs,
        errorMsg
      );
    } else if (channel_type === 'discord') {
      sendDiscordNotification(
        destination,
        targetName,
        targetUrl,
        isOnline,
        statusCode,
        latencyMs,
        errorMsg
      );
    } else if (channel_type === 'kakao' || channel_type === 'sms') {
      sendSolapiNotification(destination, targetName, isOnline, statusCode, errorMsg);
    }
  }
}

// In-memory alert channels fallback for development
export const memoryStoreAlertChannels: Array<{ channel_type: string; destination: string }> = [];
