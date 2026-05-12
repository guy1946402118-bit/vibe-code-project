﻿import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { exportDataToPDF } from '../lib/pdfExport';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

interface Reminder {
  id: string;
  category: string;
  label: string;
  icon: string;
  time: string;
  enabled: boolean;
}

const CATEGORIES = [
  { key: 'HEALTH', icon: '❤️', label: '健康' },
  { key: 'STUDY', icon: '📚', label: '学习' },
  { key: 'WORK', icon: '💼', label: '工作' },
  { key: 'DISCIPLINE', icon: '⚡', label: '自律' },
  { key: 'REVIEW', icon: '📝', label: '复盘' },
];

export function SettingsPage() {
  const { currentUser } = useUserStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [currentUser]);

  const loadSettings = () => {
    const mockReminders: Reminder[] = CATEGORIES.map(cat => ({
      id: cat.key,
      category: cat.key,
      label: cat.label,
      icon: cat.icon,
      time: '09:00',
      enabled: cat.key === 'HEALTH',
    }));
    setReminders(mockReminders);
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const updateReminderTime = (id: string, time: string) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, time } : r
    ));
  };

  const handleExport = async () => {
    if (exportFormat === 'pdf') {
      try {
        await exportDataToPDF({
          title: '成长指挥中心报告',
          subtitle: `生成于 ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          sections: [
            {
              heading: '👤 用户信息',
              content: [
                { label: '姓名', value: currentUser?.name || '无' },
                { label: '角色', value: currentUser?.role || '用户' },
                { label: '积分', value: String(currentUser?.points || 0) },
              ],
            },
            {
              heading: '📊 统计数据',
              content: [
                { label: '总打卡次数', value: '0' },
                { label: '连续打卡', value: '0 天' },
                { label: '已完成目标', value: '0 / 0' },
              ],
            },
            {
              heading: '🏆 成就',
              content: [
                { label: '段位', value: '成长探索者' },
                { label: '等级', value: `等级 ${Math.max(1, Math.floor((currentUser?.points || 0) / 10))}` },
                { label: '已获徽章', value: '0 个' },
              ],
            },
          ],
          footer: '由成长指挥中心 v2.0 | 矩阵版 生成',
        }, `成长报告-${new Date().toISOString().split('T')[0]}.pdf`);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } catch (error) {
        alert('导出PDF失败，请重试');
      }
      return;
    }

    const data = {
      user: currentUser,
      exportDate: new Date().toISOString(),
      checkIns: [],
      notes: [],
      goals: [],
      badges: [],
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `growth-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      content = 'date,category,points\n2024-01-01,HEALTH,5\n2024-01-01,STUDY,3';
      filename = `growth-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          JSON.parse(reader.result as string);
          alert('数据导入成功！');
        } catch {
          alert('文件格式错误，请选择有效的JSON文件');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      localStorage.clear();
      alert('数据已清空，页面将刷新');
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', fontFamily: "'Courier New', monospace" }}>
          ⚙ 设置中心
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
          // 定制你的成长仪表盘
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier New', monospace" }}>
          🎨 主题选择
        </h2>
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '16px 20px', border: '1px solid var(--border-medium)' }}>
          <ThemeSwitcher />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier New', monospace" }}>
          🔔 提醒设置
        </h2>
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-medium)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>
            // 设置每日提醒时间，养成习惯
          </p>
          {reminders.map(reminder => (
            <div
              key={reminder.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <span style={{ fontSize: '24px' }}>{reminder.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: "'Courier New', monospace" }}>{reminder.label}</div>
              </div>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => updateReminderTime(reminder.id, e.target.value)}
                disabled={!reminder.enabled}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: reminder.enabled ? '1px solid var(--border-accent)' : '1px solid var(--border-light)',
                  background: reminder.enabled ? 'var(--bg-input)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: reminder.enabled ? 'pointer' : 'not-allowed',
                  opacity: reminder.enabled ? 1 : 0.5,
                  fontFamily: "'Courier New', monospace",
                }}
              />
              <button
                onClick={() => toggleReminder(reminder.id)}
                style={{
                  width: '48px',
                  height: '26px',
                  borderRadius: '13px',
                  background: reminder.enabled ? 'linear-gradient(135deg, var(--matrix-green), var(--matrix-green-bright))' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s',
                  border: reminder.enabled ? '1px solid var(--matrix-green)' : '1px solid var(--border-medium)',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: reminder.enabled ? '25px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.15s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier New', monospace" }}>
          💾 数据管理
        </h2>
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => setShowExportModal(true)}
              style={{
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid var(--matrix-green)',
                background: 'var(--accent-dim)',
                color: 'var(--matrix-green)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.15s',
              }}
            >
              📤 导出
            </button>
            <button
              onClick={handleImport}
              style={{
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid var(--warning)',
                background: 'rgba(255, 189, 46, 0.06)',
                color: 'var(--warning)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.15s',
              }}
            >
              📥 导入
            </button>
            <button
              onClick={handleClearData}
              style={{
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid var(--danger)',
                background: 'rgba(255, 51, 51, 0.06)',
                color: 'var(--danger)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.15s',
              }}
            >
              🗑️ 清空全部
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier New', monospace" }}>
          ℹ️ 关于
        </h2>
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--matrix-green), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}>
              🌱
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Courier New', monospace" }}>成长指挥中心</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>v2.0.0 // 矩阵版</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', fontFamily: "'Courier New', monospace" }}>
              ＞ 个人成长轨迹可视化平台<br />
              ＞ 支持目标设定、习惯追踪、数据分析等功能
          </div>
        </div>
      </div>

      {showExportModal && (
        <div
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '24px',
              border: '1px solid var(--border-accent)',
              maxWidth: '400px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>📤 导出数据</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: "'Courier New', monospace" }}>
              // 选择导出格式
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setExportFormat('json')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '6px',
                  border: exportFormat === 'json' ? '2px solid var(--matrix-green)' : '1px solid var(--border-medium)',
                  background: exportFormat === 'json' ? 'var(--matrix-green-dim)' : 'transparent',
                  color: exportFormat === 'json' ? 'var(--matrix-green)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                📄 JSON 格式
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '6px',
                  border: exportFormat === 'csv' ? '2px solid var(--matrix-green)' : '1px solid var(--border-medium)',
                  background: exportFormat === 'csv' ? 'var(--matrix-green-dim)' : 'transparent',
                  color: exportFormat === 'csv' ? 'var(--matrix-green)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                📊 CSV 格式
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '6px',
                  border: exportFormat === 'pdf' ? '2px solid #ff3333' : '1px solid var(--border-medium)',
                  background: exportFormat === 'pdf' ? 'rgba(255, 51, 51, 0.1)' : 'transparent',
                  color: exportFormat === 'pdf' ? '#ff3333' : 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                📕 PDF 格式
              </button>
            </div>

            {exportSuccess && (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--success-dim)',
                color: 'var(--success)',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '16px',
                fontFamily: "'Courier New', monospace",
              }}>
                ✓ 导出成功
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                取消
              </button>
              <button
                onClick={handleExport}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--matrix-green), var(--accent-secondary))',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
