import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.developer';
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase_client?: SupabaseClient;
async getCurrentUser() {
  const { data } = await this.getClient().auth.getUser();
  return data.user;
}
async getSession() {
  const { data } = await this.getClient().auth.getSession();
  return data.session;
}


  private getClient(): SupabaseClient {
    if (!this.supabase_client) {
      this.supabase_client = createClient(
        environment.supabase.url,
        environment.supabase.key
      );
    }
    return this.supabase_client;
  }

async signIn(email: string, password: string) {
  email = email.trim();
  password = password.trim();
  console.log(email, password);
  const { data, error } = await this.getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}




  // // register
  // async signUpAndCreateProfile(firstName: string, lastName: string, email: string, password: string) {
  //   const client = this.getClient();

  //   // 1. إنشاء مستخدم جديد في Authentication
  //   const { data: signUpData, error: signUpError } = await client.auth.signUp({
  //     email,
  //     password
  //   });
  //   if (signUpError) throw signUpError;

  //   // 2. الحصول على الـ userId من عملية التسجيل
  //   const userId = signUpData.user?.id;
  //   if (!userId) {
  //     throw new Error('تعذر الحصول على معرف المستخدم بعد التسجيل');
  //   }

  //   // 3. إضافة البيانات إلى جدول profiles
  //   const { error: profileError } = await client
  //     .from('profiles')
  //     .insert({
  //       id: userId,
  //       first_name: firstName,
  //       last_name: lastName,
  //       email: email
  //     });

  //   if (profileError) throw profileError;

  //   return signUpData;
  // }

signUp(email: string, password: string, firstName: string, lastName: string) {
  return this.getClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: `${firstName} ${lastName}`
      }
    }
  });
}


  // // مثال: تسجيل دخول
  // signIn(email: string, password: string) {
  //   return this.supabase.auth.signInWithPassword({ email, password });
  // }

  // // مثال: الحصول على بيانات جدول
  // getProducts() {
  //   return this.supabase.from('products').select('*');
  // }

  // // مثال: إضافة بيانات
  // addProduct(data: any) {
  //   return this.supabase.from('products').insert([data]);
  // }
}
