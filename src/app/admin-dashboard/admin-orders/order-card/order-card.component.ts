import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import html2canvas from 'html2canvas';
import { SupabaseService } from '../../../supabase.service';

@Component({
  selector: 'app-order-card',
  imports: [CommonModule],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.css'
})
export class OrderCardComponent {
  @Input() order: any;
  @Output() deliver = new EventEmitter<string>();

  markAsDelivered() {
    this.deliver.emit(this.order.id);
  }

  orders: any[] = [];
  selectedOrder: any = null;
  showLogo = false;

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    this.orders = await this.supabaseService.getAllOrders();
  }

  async deliverOrder(orderId: string) {
    await this.supabaseService.markAsDelivered(orderId);
    this.orders = await this.supabaseService.getAllOrders(); // تحديث بعد التسليم
    this.selectedOrder = null;
  }
  takeScreenshot() {
    const element = document.getElementById('recipt');

    this.showLogo = true;

    setTimeout(() => {
      if (element) {
        html2canvas(element).then((canvas) => {
          const image = canvas.toDataURL('image/png');

          const link = document.createElement('a');
          link.href = image;
          link.download = 'screenshot.png';
          link.click();

          this.showLogo = false;
        });
      }
    }, 100);
  }


  // with supabase

}
