export interface PushConfig {
  enabled: boolean;
  pushType: 'webpush' | 'wechat' | 'email' | 'sms';
  wechatWebhook?: string;
  emailConfig?: {
    smtpHost: string;
    smtpPort: number;
    email: string;
    password: string;
    toEmail: string;
  };
  smsConfig?: {
    provider: 'twilio' | 'aliyun' | 'tencent';
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    toNumber: string;
    accessKeyId?: string;
    accessKeySecret?: string;
    templateCode?: string;
  };
  dailySummaryTime: string;
  summaryTypes: {
    checkin: boolean;
    points: boolean;
    streak: boolean;
    rank: boolean;
    notes: boolean;
  };
}

export const DEFAULT_PUSH_CONFIG: PushConfig = {
  enabled: false,
  pushType: 'webpush',
  dailySummaryTime: '21:00',
  summaryTypes: {
    checkin: true,
    points: true,
    streak: true,
    rank: true,
    notes: true,
  }
};

export interface DailySummary {
  date: string;
  checkinCount: number;
  checkinDetails: { category: string; icon: string; points: number }[];
  totalPoints: number;
  currentStreak: number;
  currentRank: string;
  notesCount: number;
  message: string;
}

export function generateDailySummary(data: {
  todayCheckIns: { category: string; points: number }[];
  totalPoints: number;
  streak: number;
  rankName: string;
  notesToday: number;
}): DailySummary {
  const icons: Record<string, string> = {
    health: '❤️',
    study: '📚',
    work: '💼',
    discipline: '🎯',
    review: '📝'
  };

  const checkinDetails = data.todayCheckIns.map(c => ({
    category: c.category,
    icon: icons[c.category] || '📌',
    points: c.points
  }));

  const checkinCount = data.todayCheckIns.length;
  
  let message = `🌟 今日成长总结\n\n`;
  
  if (checkinCount > 0) {
    message += `✅ 打卡完成: ${checkinCount}/5\n`;
    checkinDetails.forEach(c => {
      message += `  ${c.icon} ${c.category} +${c.points}分\n`;
    });
  } else {
    message += `❌ 今日还未打卡，快去行动吧！\n`;
  }
  
  message += `\n📊 累计积分: ${data.totalPoints}分\n`;
  message += `🔥 连续天数: ${data.streak}天\n`;
  message += `🏆 当前段位: ${data.rankName}\n`;
  
  if (data.notesToday > 0) {
    message += `📝 今日笔记: ${data.notesToday}篇\n`;
  }
  
  message += `\n💪 明天继续加油！`;

  return {
    date: new Date().toLocaleDateString('zh-CN'),
    checkinCount,
    checkinDetails,
    totalPoints: data.totalPoints,
    currentStreak: data.streak,
    currentRank: data.rankName,
    notesCount: data.notesToday,
    message
  };
}

export async function sendWebPush(_config: PushConfig, summary: DailySummary) {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return { success: false, message: '浏览器不支持通知' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, message: '通知权限未授权' };
  }

  new Notification('🌱 成长仪表盘 - 每日总结', {
    body: summary.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });

  return { success: true, message: '浏览器通知已发送' };
}

export async function sendToWechat(webhook: string, summary: DailySummary): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: summary.message
        }
      })
    });
    return response.ok 
      ? { success: true, message: '微信消息已发送' }
      : { success: false, message: '微信发送失败' };
  } catch (error) {
    console.error('Failed to send to WeChat:', error);
    return { success: false, message: '网络错误' };
  }
}

export async function sendEmail(config: PushConfig['emailConfig'], summary: DailySummary): Promise<{ success: boolean; message: string }> {
  if (!config) {
    return { success: false, message: '邮箱配置不完整' };
  }
  
  const subject = `🌱 成长仪表盘 - ${summary.date} 每日总结`;
  const htmlContent = summary.message.replace(/\n/g, '<br>');
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        email: config.email,
        password: config.password,
        toEmail: config.toEmail,
        subject,
        htmlContent
      })
    });
    
    if (response.ok) {
      return { success: true, message: '邮件已发送' };
    } else {
      return { success: false, message: '邮件发送失败' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: '邮件发送需要配合后端服务。请配置服务端 API，或使用浏览器通知功能。' 
    };
  }
}

export async function sendSms(config: PushConfig['smsConfig'], summary: DailySummary): Promise<{ success: boolean; message: string }> {
  if (!config) {
    return { success: false, message: '短信配置不完整' };
  }
  
  const shortMessage = summary.message.slice(0, 300);
  
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        accountSid: config.accountSid,
        authToken: config.authToken,
        fromNumber: config.fromNumber,
        toNumber: config.toNumber,
        message: shortMessage,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        templateCode: config.templateCode
      })
    });
    
    if (response.ok) {
      return { success: true, message: '短信已发送' };
    } else {
      return { success: false, message: '短信发送失败' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: '短信发送需要配合后端服务。请配置服务端 API，或使用浏览器通知功能。' 
    };
  }
}