﻿﻿﻿﻿﻿import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { KnowledgeGraphData } from '../lib/api';

interface Props {
  data: KnowledgeGraphData | null;
  loading: boolean;
  onNodeClick: (nodeId: string) => void;
  category?: string;
}

const categoryColors: Record<string, string> = {
  '科技产品': '#00f0ff',
  '汽车': '#ff6b6b',
  '能源': '#ffbd2e',
  '生活': '#96CEB4',
};

const nodeTypeConfig: Record<string, { size: number; color: string }> = {
  CATEGORY: { size: 28, color: 'var(--matrix-green)' },
  CONCEPT: { size: 18, color: '#00f0ff' },
  ENTITY: { size: 14, color: '#ffbd2e' },
  TAG: { size: 10, color: '#dda0dd' },
  ARTICLE: { size: 12, color: '#ff6b6b' },
};

export function KnowledgeGraph({ data, loading, onNodeClick, category }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || loading) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        backgroundColor: 'transparent',
      });
    }

    const chart = chartRef.current;

    const nodes = data.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      symbolSize: nodeTypeConfig[n.type]?.size || 14,
      category: n.isCategory ? 0 : n.type === 'CONCEPT' ? 1 : n.type === 'ENTITY' ? 2 : 3,
      itemStyle: {
        color: n.isCategory
          ? 'var(--matrix-green)'
          : categoryColors[n.category || ''] || nodeTypeConfig[n.type]?.color || '#888',
      },
      label: {
        show: n.isCategory || n.weight > 50,
        fontSize: n.isCategory ? 12 : 10,
        color: '#e8e8e8',
        fontFamily: "'Courier New', monospace",
      },
    }));

    const relationLabels: Record<string, string> = {
      BELONGS_TO: '属于', RELATED_TO: '关联', HAS_TAG: '标签', INSTANCE_OF: '实例',
      SIMILAR_TO: '相似', DEPENDS_ON: '依赖', AUTHORED_BY: '作者', SUPERCEDES: '替代',
    };

    const edges = data.edges.map((e) => ({
      source: e.fromId,
      target: e.toId,
      lineStyle: {
        color: 'rgba(0, 240, 255, 0.5)',
        width: 1.5,
        curveness: 0.2,
        opacity: 0.7,
      },
      label: {
        show: true,
        formatter: relationLabels[(e as any).relation] || (e as any).relation || '',
        color: 'rgba(0,240,255,0.7)',
        fontSize: 9,
        fontFamily: "'Courier New', monospace",
        position: 'middle',
      },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'edge') return '';
          const name = params.name;
          const type = params.data?.category ?? '';
          return `<span style="color:var(--matrix-green);font-family:'Courier New',monospace">${name}</span>`;
        },
        backgroundColor: 'rgba(10,10,10,0.95)',
        borderColor: 'var(--matrix-green-dim)',
        textStyle: { color: '#e8e8e8', fontSize: 12 },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          data: nodes,
          links: edges,
          force: {
            repulsion: 200,
            gravity: 0.08,
            edgeLength: [50, 180],
            layoutAnimation: true,
          },
          lineStyle: {
            color: 'rgba(0, 240, 255, 0.4)',
            curveness: 0.2,
            width: 1.2,
            opacity: 0.6,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 1.5 },
          },
          categories: [
            { name: '分类' },
            { name: '概念' },
            { name: '实体' },
            { name: '标签' },
          ],
        },
      ],
    };

    chart.setOption(option, true);

    chart.off('click');
    chart.on('click', (params: any) => {
      if (params.dataType === 'node' && params.data?.id) {
        onNodeClick(params.data.id);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading, onNodeClick]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        ref={containerRef}
        className="glass-card"
        style={{
          width: '100%',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        ⏳ 加载知识图谱...
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          width: '100%',
          height: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '48px' }}>🕸️</span>
        <span>知识图谱暂无数据</span>
        <span style={{ fontSize: '12px' }}>请先发布博客文章或初始化种子数据</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="glass-card"
      style={{
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
    />
  );
}