import { onMounted, type Ref } from 'vue';
import * as d3 from 'd3';

interface BracketMatch {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score1?: number;
  score2?: number;
}

export function useBracketD3(containerRef: Ref<HTMLElement | null>, matches: Ref<BracketMatch[]>) {
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  function render() {
    if (!containerRef.value || matches.value.length === 0) return;
    d3.select(containerRef.value).selectAll('*').remove();

    const width = containerRef.value.clientWidth || 600;
    const height = Math.max(400, matches.value.length * 60);
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg = d3.select(containerRef.value)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const matchHeight = 40;
    const gap = 10;
    const rounds = d3.groups(matches.value, (m) => m.round).reverse();

    rounds.forEach(([round, ms], ri) => {
      const x = margin.left + ri * (width - margin.left - margin.right) / Math.max(rounds.length, 1);
      const roundWidth = (width - margin.left - margin.right) / Math.max(rounds.length, 1) - 10;

      svg!.append('text')
        .attr('x', x + roundWidth / 2)
        .attr('y', margin.top)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text(`Round ${round}`);

      ms.forEach((match, mi) => {
        const y = margin.top + 20 + mi * (matchHeight + gap);
        const bw = roundWidth * 0.8;

        const box = svg!.append('g');

        box.append('rect')
          .attr('x', x + (roundWidth - bw) / 2)
          .attr('y', y)
          .attr('width', bw)
          .attr('height', matchHeight)
          .attr('fill', match.winner ? '#e8f5e9' : '#f5f5f5')
          .attr('stroke', '#ccc')
          .attr('rx', 4);

        const centerX = x + roundWidth / 2;
        const textY = y + matchHeight / 2;

        box.append('text')
          .attr('x', centerX)
          .attr('y', textY - 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('fill', match.winner === match.player1 ? '#1976D2' : '#333')
          .text(match.player1 || 'TBD');

        box.append('text')
          .attr('x', centerX)
          .attr('y', textY + 12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('fill', match.winner === match.player2 ? '#1976D2' : '#333')
          .text(match.player2 || 'TBD');

        if (mi % 2 === 0 && mi + 1 < ms.length) {
          const nextY = y + matchHeight + gap + (matchHeight + gap) / 2;
          svg!.append('line')
            .attr('x1', x + roundWidth)
            .attr('y1', y + matchHeight / 2)
            .attr('x2', x + roundWidth + 5)
            .attr('y2', nextY)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
        }
      });
    });
  }

  onMounted(render);

  return { render };
}
