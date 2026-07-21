import { NextRequest, NextResponse } from 'next/server';
import {
  sendSlackNotification,
  sendDiscordNotification,
  sendSolapiNotification,
} from '@/lib/notifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_type, destination } = body;

    if (!channel_type || !destination) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'channel_type 및 destination 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    let success = false;
    const testTargetName = '테스트 서비스 (watchdog-hq)';
    const testTargetUrl = 'http://localhost:3088';

    if (channel_type === 'slack') {
      success = await sendSlackNotification(
        destination,
        testTargetName,
        testTargetUrl,
        true,
        200,
        15,
        '🎉 테스트 알림 발송 성공! watchdog-hq 실시간 장애 알림 연동이 완료되었습니다.'
      );
    } else if (channel_type === 'discord') {
      success = await sendDiscordNotification(
        destination,
        testTargetName,
        testTargetUrl,
        true,
        200,
        15,
        '🎉 테스트 알림 발송 성공! watchdog-hq 실시간 장애 알림 연동이 완료되었습니다.'
      );
    } else if (channel_type === 'kakao' || channel_type === 'sms') {
      success = await sendSolapiNotification(
        destination,
        testTargetName,
        true,
        200,
        '🎉 테스트 알림 발송 성공! watchdog-hq 알림 연동이 완료되었습니다.'
      );
    }

    if (success) {
      return NextResponse.json({
        status: 'success',
        message: '테스트 알림 메시지가 성공적으로 발송되었습니다!',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Dispatch Failed',
          message: '알림 발송에 실패했습니다. 수신 주소 또는 API 키 설정을 다시 확인해 주세요.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
