import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://umwzrxdhmqzhwmzlcygx.supabase.co';
    const supabaseKey = 'sb_publishable_sFwkkreZEdT2pUIxVJxHFQ_8Msc17jB';
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
