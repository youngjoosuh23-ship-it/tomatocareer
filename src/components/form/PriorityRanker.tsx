import React from 'react';
import { motion } from 'motion/react';
import { UserPriorities } from '../../types';

type PriorityKey = 'job_fit' | 'growth' | 'culture' | 'compensation' | 'risk';

const CRITERIA_LABELS: Record<PriorityKey, Record<'ko' | 'en' | 'zh', string>> = {
  job_fit:      { ko: '직무 적합도', en: 'Job Fit',     zh: '職務適合度' },
  growth:       { ko: '성장 가능성', en: 'Growth',       zh: '成長可能性' },
  culture:      { ko: '문화 적합성', en: 'Culture Fit',  zh: '文化適合性' },
  compensation: { ko: '보상',       en: 'Compensation', zh: '薪酬'       },
  risk:         { ko: '리스크',     en: 'Risk',          zh: '風險'       },
};

const DEFAULT_ORDER: PriorityKey[] = ['job_fit', 'growth', 'culture', 'compensation', 'risk'];

function prioritiesToOrder(p: UserPriorities): PriorityKey[] {
  return [...DEFAULT_ORDER].sort((a, b) => (p[b] ?? 0) - (p[a] ?? 0));
}

function orderToPriorities(order: PriorityKey[]): UserPriorities {
  const result = {} as UserPriorities;
  order.forEach((key, i) => { result[key] = (5 - i) as 1 | 2 | 3 | 4 | 5; });
  return result;
}

interface PriorityRankerProps {
  priorities?: UserPriorities;
  onChange: (priorities: UserPriorities) => void;
  language: 'en' | 'ko' | 'zh';
}

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#4a4a47',
  marginBottom: 7,
  letterSpacing: '-0.01em',
};

export function PriorityRanker({ priorities, onChange, language }: PriorityRankerProps) {
  const [dragOrder, setDragOrder] = React.useState<PriorityKey[]>(() =>
    priorities ? prioritiesToOrder(priorities) : DEFAULT_ORDER
  );
  const [draggingKey, setDraggingKey] = React.useState<PriorityKey | null>(null);
  const dragItemIndex = React.useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
    setDraggingKey(dragOrder[index]);
  };

  const handleDragEnter = (index: number) => {
    if (dragItemIndex.current === null || dragItemIndex.current === index) return;
    setDragOrder(prev => {
      const next = [...prev];
      const [removed] = next.splice(dragItemIndex.current!, 1);
      next.splice(index, 0, removed);
      dragItemIndex.current = index;
      return next;
    });
  };

  const handleDragEnd = () => {
    onChange(orderToPriorities(dragOrder));
    setDraggingKey(null);
    dragItemIndex.current = null;
  };

  return (
    <div>
      <label style={{ ...FIELD_LABEL, marginBottom: 4 }}>
        {language === 'ko' ? '우선순위' : language === 'zh' ? '優先順序' : 'Priorities'}
      </label>
      <p style={{ fontSize: 11.5, color: '#9a9a96', marginBottom: 12 }}>
        {language === 'ko' ? '드래그로 순서 변경 · 위 = 최우선' : language === 'zh' ? '拖曳排序 · 上方 = 最優先' : 'Drag to reorder · Top = highest priority'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {dragOrder.map((key, index) => {
          const rank = 5 - index;
          const label = CRITERIA_LABELS[key][language];
          const isDragging = draggingKey === key;
          return (
            <motion.div
              key={key}
              layout
              transition={{ duration: 0.15, ease: 'easeOut' }}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
              animate={{ opacity: isDragging ? 0.45 : 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: '#f7f7f6',
                border: '2px solid transparent',
                cursor: 'grab', userSelect: 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FF6B6B', width: 16, textAlign: 'center', flexShrink: 0 }}>{rank}</span>
              <div style={{ width: 1, height: 14, background: 'rgba(29,29,27,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1d1d1b', flex: 1 }}>{label}</span>
              <span style={{ color: '#c8c8c4', fontSize: 15, letterSpacing: 1 }}>⠿</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
