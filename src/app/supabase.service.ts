// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';
import { CartItem } from './services/data.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  get client() {
    return this.supabase;
  }

  // ==========================
  // Auth
  // ==========================

  async getCurrentUserEmail(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      console.error('No user logged in:', error?.message);
      return null;
    }

    return data.user.email ?? null;
  }

  async getCurrentUserName(): Promise<string | null> {
    const email = await this.getCurrentUserEmail();
    if (!email) return null;

    // Extract the part before "@"
    return email.split('@')[0];
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('User not found');

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    return { ...data, isAdmin: profile.role === 'admin' };
  }

  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: `${firstName} ${lastName}`
        }
      }
    });
  }

  // login with facebook

  async signInWithFacebook() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'facebook',
    });
    if (error) throw error;
    return data;
  }


  // login with Google
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });

      if (error) {
        console.error('Error:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }

  getUser() {
    return this.supabase.auth.getSession();
  }

  async changePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  // ==========================
  // Carts
  // ==========================
  async createCart(
    userEmail: string,
    name: string,
    phone: string,
    department: string,
    note: string,
    subtotal: number,
    total: number,
    count: number
  ) {
    const shipping = Number((total - subtotal).toFixed(2));

    const { data, error } = await this.supabase
      .from('carts')
      .insert([
        {
          user_email: userEmail,
          user_name: name,
          user_phone: phone,
          subtotal,
          shipping,
          estimate_for: department,
          note,
          total,
          count,
          isDelivered: false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addCartItems(cartId: string, items: any[]) {
    const { error } = await this.supabase
      .from('cart_items')
      .insert(items);

    if (error) throw error;
  }

  async insertCart(cart: any) {
    const { data, error } = await this.supabase
      .from('carts')
      .insert([cart]);
    if (error) throw error;
    return data;
  }

  async getAllOrders() {
    const { data, error } = await this.supabase
      .from('carts')
      .select(`
        *,
        cart_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async markAsDelivered(cartId: string) {
    const { data, error } = await this.supabase
      .from('carts')
      .update({ isDelivered: true })
      .eq('id', cartId)
      .select();

    if (error) throw error;
    return data;
  }

  // ==========================
  // Favourites
  // ==========================
  async addToFavourites(userEmail: string, productId: string) {
    const { data, error } = await this.supabase
      .from('favourites')
      .insert([{ user_email: userEmail, product_id: productId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeFromFavourites(userEmail: string, productId: string) {
    const { data, error } = await this.supabase
      .from('favourites')
      .delete()
      .eq('user_email', userEmail)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async isInFavourites(userEmail: string, productId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('favourites')
      .select('id')
      .eq('user_email', userEmail)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async getUserFavouriteProductIds(userEmail: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('favourites')
      .select('product_id')
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error fetching favourite product ids:', error);
      return [];
    }

    return data.map((fav: any) => fav.product_id);
  }

  async getProductsByIds(productIds: string[]) {
    if (productIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data;
  }

  async loadUserFavourites(userEmail: string) {
    const productIds = await this.getUserFavouriteProductIds(userEmail);
    return this.getProductsByIds(productIds);
  }

  // ==========================
  // Profile Images
  // ==========================
  private _profileImageSubject = new BehaviorSubject<string | null>(null);
  public profileImage$ = this._profileImageSubject.asObservable();

  async uploadProfileImage(file: File, userId: string): Promise<string | null> {
    try {
      const folderPath = `avatars/${userId}`;
      const filePath = `${folderPath}/${Date.now()}_${file.name}`;

      const { data: files, error: listError } = await this.supabase.storage
        .from('avatars')
        .list(folderPath);

      if (listError) {
        console.error('Error listing files:', listError.message);
      } else if (files && files.length > 0) {
        const filesToRemove = files.map(f => `${folderPath}/${f.name}`);
        const { error: removeError } = await this.supabase.storage
          .from('avatars')
          .remove(filesToRemove);

        if (removeError) {
          console.error('Error deleting old files:', removeError.message);
        }
      }

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        return null;
      }

      const { data } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
      if (publicUrl) this._profileImageSubject.next(publicUrl);

      return publicUrl;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }

  async getProfileImage(userId: string): Promise<string> {
    try {
      const folderPath = `avatars/${userId}`;
      const { data: files, error } = await this.supabase.storage
        .from('avatars')
        .list(folderPath);

      if (error) {
        console.error("Error listing files:", error.message);
        return "images/background.png";
      }

      if (!files || files.length === 0) {
        return "images/background.png";
      }

      const latestFile = files.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      )[0];

      const filePath = `${folderPath}/${latestFile.name}`;
      const { data: publicData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl ? `${publicData.publicUrl}?t=${Date.now()}` : "images/background.png";

      this._profileImageSubject.next(publicUrl);

      return publicUrl;
    } catch (err) {
      console.error("Unexpected error:", err);
      return "images/background.png";
    }
  }

  // ==========================
  // Games & Questions
  // ==========================
  async getGames() {
    const { data, error } = await this.supabase.from('games').select('*');
    if (error) throw error;
    return data;
  }

  async getGameById(gameId: number) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (error) throw error;
    return data;
  }

  async getQuestions(gameId: number, level: number) {
    const { data, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('game_id', gameId)
      .eq('level', level);
    if (error) throw error;
    return data;
  }

  async addGame(name: string, gameType: string, levelCount: number) {
    const { data, error } = await this.supabase
      .from('games')
      .insert([{ name, game_type: gameType, level_count: levelCount }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async addQuestion(
    gameId: number,
    level: number,
    difficulty: string,
    questionText: string,
    imageUrl: string,
    correctAnswer: string,
    timeLimit: number
  ) {
    const { data, error } = await this.supabase
      .from('questions')
      .insert([{
        game_id: gameId,
        level,
        difficulty,
        question_text: questionText,
        image_url: imageUrl,
        correct_answer: correctAnswer,
        time_limit: timeLimit
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ==========================
  // French Departments
  // ==========================
  async getFrenchDepartments(): Promise<{ code: string; name: string }[]> {
    const { data, error } = await this.supabase.from('french_departments').select('*');
    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
    return data as { code: string; name: string }[];
  }

  // ==========================
  // contact us
  // ==========================

  async sendContactForm(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    message: string;
  }) {
    const user = await this.supabase.auth.getUser();
    const user_id = user.data.user?.id || null;

    const { error } = await this.supabase.from('contact_messages').insert([
      {
        ...data,
        user_id,
      },
    ]);

    if (error) throw error;
    return true;
  }

  async getContactMessages() {
    const { data, error } = await this.supabase.from('contact_messages').select('*');
    if (error) throw error;
    return data;
  }


  // ==========================
  // get products for search
  // ==========================


   async getProductsTitles(): Promise<{ id: string; title: string }[]> {
    const { data, error } = await this.client
      .from('products')
      .select('id, title');

    if (error) {
      console.error('Error fetching products titles:', error.message);
      return [];
    }

    return data || [];
  }
}

