// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';
import { CartItem } from './services/data.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
// داخل SupabaseService
export interface MatchEmojiItem {
  id: string;
  level: number;
  difficulty?: string | null;
  emojis: { word: string; emoji: string }[]; // كل عنصر فيه كلمة وإيموجي
}
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


  // ==========================
// guessing_country
// ==========================

async getQuestions(level: number) {
  const { data, error } = await this.supabase
    .from('guessing_country')
    .select('*')
    .eq('level', level);

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  return data;
}


  // ==========================
// true_or_false
// ==========================

async getQuestionsByLevel(level: number) {
    const { data, error } = await this.supabase
      .from('true_or_false')
      .select('*')
      .eq('level', level);

    if (error) throw error;
    return data;
  }


// ==========================
// geo-map
// ==========================
  /**
   * Fetches geo map data for a specific level
   * @param level The difficulty level to fetch data for
   * @returns Array of geo map entries with id, value, and chooses
   */
  async getGeoMapByLevel(level: number): Promise<Array<{
    id: string;
    value: string;
    chooses: string[];
    location: number[];
    difficulty: string | null;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('geo_map')
        .select('*')
        .eq('level', level);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching geo map data:', error);
      return [];
    }
  }
  

  // ==========================
// geo-map
// ==========================


async getEmojisQuestions(level: number) {
  const { data, error } = await this.supabase
    .from('guessing_emojis')
    .select('*')
    .eq('level', level);

  if (error) {
    console.error('Error fetching emojis questions:', error);
    return [];
  }

  return data;
}


  // ==========================
// sort letter
// ==========================



// في SupabaseService
async getSortingLettersQuestions(level: number) {
  const { data, error } = await this.supabase
    .from('sorting_letters')
    .select('*')
    .eq('level', level);

  if (error) {
    console.error('Error fetching sorting letters questions:', error);
    return [];
  }
  return data;
}

// ==========================
// sentence sorting
// ==========================
async getSentenceSorting(level: number) {
  const { data, error } = await this.supabase
    .from('sentence_sorting')
    .select('*')
    .eq('level', level);

  if (error) {
    console.error('Error fetching sentence sorting questions:', error);
    return [];
  }
  return data;
}



async getMatchItems(level: number): Promise<MatchEmojiItem[]> {
  const { data, error } = await this.supabase
  .from<'match_emojis_with_words', any>('match_emojis_with_words')
  .select('*')
  .eq('level', level);

return (data as MatchEmojiItem[]) || [];

  if (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }

  return data || [];
}




// --- supabase.service.ts (fixed versions) ---

/** ensure a players row exists (upsert by email) */
async upsertPlayer(email: string): Promise<boolean> {
  try {
    const { error } = await this.supabase
      .from('players')
      // pass an array of rows and a string onConflict
      .upsert([{ email }], { onConflict: 'email' }); 

    if (error) {
      console.error('upsertPlayer error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertPlayer exception:', err);
    return false;
  }
}

/** fallback UUID v4 generator (keeps TypeScript safe if crypto.randomUUID unavailable) */
private generateUUID(): string {
  if (typeof (globalThis as any).crypto?.randomUUID === 'function') {
    return (globalThis as any).crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Upsert player_level for given player/email and game.
 * - uses onConflict as a string 'player_id,game_id'
 * - passes an array of rows to upsert to satisfy the typed overload
 * - chains .select() if you want the row(s) returned
 */
async upsertPlayerLevel(gameId: number, level: number, questionNum: number): Promise<boolean> {
  try {
    const email = await this.getCurrentUserEmail();
    if (!email) {
      console.warn('upsertPlayerLevel: no logged-in user.');
      return false;
    }

    // ensure player exists first
    const ok = await this.upsertPlayer(email);
    if (!ok) {
      console.warn('upsertPlayerLevel: failed to ensure player row.');
      // we continue (FK might still fail) but at least attempted
    }

    const uuid = this.generateUUID();

    const payload = {
      uuid,
      player_id: email,
      game_id: gameId,
      level,
      question_num: questionNum,
      updated_at: new Date().toISOString()
    };

    // note: pass payload as array and onConflict as string
    const { data, error } = await this.supabase
      .from('player_level')
      .upsert([payload], { onConflict: 'player_id,game_id' })
      .select(); // .select() returns the inserted/updated rows

    if (error) {
      console.error('upsertPlayerLevel error:', error);
      return false;
    }
    // optionally inspect `data` if you need the saved row
    return true;
  } catch (err) {
    console.error('upsertPlayerLevel exception:', err);
    return false;
  }
}

/** convenience wrapper */
async savePlayerProgress(gameId: number, level: number, questionNum: number): Promise<boolean> {
  return this.upsertPlayerLevel(gameId, level, questionNum);
}




// Add to your Supabase service (near the other helper methods)

async getPlayerProgress(gameId: number): Promise<{ level: number; question_num: number } | null> {
  try {
    const email = await this.getCurrentUserEmail();
    if (!email) {
      console.warn('getPlayerProgress: no logged-in user');
      return null;
    }

    // maybeSingle() returns null when no row exists (Supabase JS v2).
    // If your version doesn't support maybeSingle(), replace with .limit(1).single() and handle the not-found error.
    const { data, error } = await this.supabase
      .from('player_level')
      .select('level,question_num')
      .eq('player_id', email)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      console.error('getPlayerProgress error:', error);
      return null;
    }

    if (!data) return null;
    // ensure numbers
    return { level: Number(data.level || 1), question_num: Number(data.question_num || 1) };
  } catch (err) {
    console.error('getPlayerProgress exception:', err);
    return null;
  }
}

}
