import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { supabase } from '../../supabase.client';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {

  @ViewChild('myChart') myChart!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  async loadData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('carts')
      .select('created_at, total, isDelivered')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Supabase error:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('⚠ No data for the last 30 days');
      return;
    }

    const dailyTotals: Record<string, number> = {};
    const dailyDelivered: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    data.forEach((item: any) => {
      const day = new Date(item.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      });

      // total sales
      dailyTotals[day] = (dailyTotals[day] || 0) + Number(item.total);

      // count all orders
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;

      // count delivered
      if (item.isDelivered) {
        dailyDelivered[day] = (dailyDelivered[day] || 0) + 1;
      }
    });

    const labels = Object.keys(dailyTotals).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const totalValues = labels.map(day => dailyTotals[day] || 0);
    const deliveredRatio = labels.map(day => {
      const delivered = dailyDelivered[day] || 0;
      const totalOrders = dailyCounts[day] || 1;
      return (delivered / totalOrders) * 100; // percentage
    });

    this.createChart(labels, totalValues, deliveredRatio);
  }

  createChart(labels: string[], totalValues: number[], deliveredRatio: number[]) {
    const ctx = this.myChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Sales',
            data: totalValues,
            borderColor: '#ff6384',
            backgroundColor: 'rgba(255,99,132,0.2)',
            yAxisID: 'y',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Delivered Orders (%)',
            data: deliveredRatio,
            borderColor: '#36a2eb',
            backgroundColor: 'rgba(54,162,235,0.2)',
            yAxisID: 'y1',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sales & Delivery Ratio (Last 30 Days)',
            font: { size: 18 }
          },
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            title: { display: true, text: 'Date' }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Total Sales ($)' },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Delivered (%)' },
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }
}
