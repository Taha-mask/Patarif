import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { SupabaseService } from '../../supabase.service';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-admin-contact-messages',
  imports: [AdminNavbarComponent, CommonModule],
  templateUrl: './admin-contact-messages.component.html',
  styleUrls: ['./admin-contact-messages.component.css']
})
export class AdminContactMessagesComponent {
  messages: any[] = [];
  constructor(private supabaseServic: SupabaseService){}
  async ngOnInit(){
    this.getMessages();
  } 
  
  async getMessages(){
    this.messages = await this.supabaseServic.getContactMessages();
  }

  openGmail(email: string) {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  window.open(url, '_blank');
}

}
