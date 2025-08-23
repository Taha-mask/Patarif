import { Story } from './../../interface/story';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
}) export class NavbarComponent {
  profileImageUrl: string = "images/background.png"; // default
  // userId: string = "";

  // constructor(private supabaseService: SupabaseService) { }

  // ngOnInit() {
  //   // 🟢 استنى لحد ما الـ authReady يبقى true
  //   this.supabaseService.getAuthReadyObservable().subscribe(async (authReady) => {
  //     if (authReady) {
  //       const user = this.supabaseService.getCurrentUserSync();

  //       if (user) {
  //         this.userId = user.id;

  //         // ✅ هات صورة البروفايل لو موجودة
  //         const imageUrl = await this.supabaseService.getProfileImage(this.userId);
  //         this.profileImageUrl = imageUrl || "images/background.png";
  //       } else {
  //         // 🔴 مفيش مستخدم → fallback
  //         this.profileImageUrl = "images/background.png";
  //       }
  //     }
  //   });
  // }
}