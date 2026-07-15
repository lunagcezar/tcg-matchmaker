import { watch, type Ref } from 'vue';
import * as d3 from 'd3';

export interface BracketMatch {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score1?: number;
  score2?: number;
}

export function useBracketD3(containerRef: Ref<HTMLElement | null>, matches: Ref<BracketMatch[]>) {
  function render() {
    const el = containerRef.value;
    if (!el || matches.value.length === 0) return;

    d3.select(el).selectAll('*').remove();

    const width = el.clientWidth || 600;
    const height = Math.max(400, matches.value.length * 60);
    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height);

    const groups = d3.groups(matches.value, (m) => m.round);
    const numRounds = d3.max(matches.value, (m) => m.round) ?? 1;
    const colW = (width - 40) / numRounds;
    const rowH = 40;
    const gap = 12;

    for (const [round, ms] of groups) {
      const x = 20 + (round - 1) * colW;
      const boxW = colW * 0.75;

      svg
        .append('text')
        .attr('x', x + boxW / 2)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text(`Round ${round}`);

      ms.forEach((m, i) => {
        const y = 30 + i * (rowH + gap);
        const g = svg.append('g');

        g.append('rect')
          .attr('x', x + (colW - boxW) / 2)
          .attr('y', y)
          .attr('width', boxW)
          .attr('height', rowH)
          .attr('fill', m.winner ? '#e8f5e9' : '#f5f5f5')
          .attr('stroke', '#ccc')
          .attr('rx', 4);

        const cx = x + colW / 2;
        g.append('text')
          .attr('x', cx)
          .attr('y', y + 14)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', m.winner === m.player1 ? 'bold' : 'normal')
          .text(m.player1 || 'TBD');
        g.append('text')
          .attr('x', cx)
          .attr('y', y + 28)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', m.winner === m.player2 ? 'bold' : 'normal')
          .text(m.player2 || 'TBD');

        if (i % 2 === 0 && i + 1 < ms.length) {
          const ny = y + rowH + gap / 2;
          svg
            .append('line')
            .attr('x1', x + colW)
            .attr('y1', y + rowH / 2)
            .attr('x2', x + colW + 4)
            .attr('y2', ny + rowH / 2)
            .attr('stroke', '#bbb')
            .attr('stroke-width', 1);
        }
      });
    }
  }

  watch([containerRef, matches], render, { immediate: true, deep: true });
}
