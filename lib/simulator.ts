import { supabase } from './supabase';

export interface SimDeal {
  id: string;
  title: string;
  address: string;
  image_url: string | null;
  price: number;
  purchase_date: string | null;
  lot_size_sqft: number | null;
  zoning: string | null;
  current_owner: string | null;
  jurisdiction: string | null;
  flood_zone: string | null;
  utilities: string | null;
  order_index: number;
  expert_build_sqft: number | null;
  expert_cost_per_sqft: number | null;
  expert_closing_pct: number | null;
  expert_holding_months: number | null;
  expert_sale_price: number | null;
  expert_decision: string | null;
  expert_rationale: string | null;
  lesson: string | null;
  is_published: boolean;
  created_at: string;
}

export interface SimDealFact {
  id: string;
  deal_id: string | null;
  order_index: number;
  title: string;
  content: string;
  icon: string | null;
}

export interface SimZoningQuestion {
  id: string;
  deal_id: string | null;
  order_index: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  correct_option: string;
  explanation: string;
}

export interface SimSurpriseCard {
  id: string;
  deal_id: string | null;
  title: string;
  description: string;
  impact_type: string | null;
  impact_amount: number | null;
  related_fact_title: string | null;
}

export interface SimDealFull extends SimDeal {
  facts: SimDealFact[];
  zoning_questions: SimZoningQuestion[];
  surprise_cards: SimSurpriseCard[];
}

export interface SimPlay {
  id: string;
  user_id: string | null;
  deal_id: string | null;
  gut_call: string | null;
  facts_investigated: string[];
  zoning_correct: number;
  zoning_total: number;
  numbers: Record<string, unknown> | null;
  surprise_card_id: string | null;
  adjusted_after_surprise: boolean;
  decision: string | null;
  vision_text: string | null;
  profit_estimate: number | null;
  rating: string | null;
  created_at: string;
}

export async function fetchDeals(opts?: { includeUnpublished?: boolean }): Promise<SimDeal[]> {
  let query = supabase
    .from('sim_deals')
    .select('*')
    .order('order_index', { ascending: true });

  if (!opts?.includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SimDeal[];
}

export async function fetchDealFull(dealId: string): Promise<SimDealFull> {
  const [dealRes, factsRes, questionsRes, cardsRes] = await Promise.all([
    supabase.from('sim_deals').select('*').eq('id', dealId).single(),
    supabase.from('sim_deal_facts').select('*').eq('deal_id', dealId).order('order_index', { ascending: true }),
    supabase.from('sim_zoning_questions').select('*').eq('deal_id', dealId).order('order_index', { ascending: true }),
    supabase.from('sim_surprise_cards').select('*').eq('deal_id', dealId),
  ]);

  if (dealRes.error) throw dealRes.error;
  if (factsRes.error) throw factsRes.error;
  if (questionsRes.error) throw questionsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  return {
    ...(dealRes.data as SimDeal),
    facts: (factsRes.data ?? []) as SimDealFact[],
    zoning_questions: (questionsRes.data ?? []) as SimZoningQuestion[],
    surprise_cards: (cardsRes.data ?? []) as SimSurpriseCard[],
  };
}

export async function createPlay(payload: {
  user_id: string;
  deal_id: string;
  gut_call?: string;
}): Promise<SimPlay> {
  const { data, error } = await supabase
    .from('sim_plays')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as SimPlay;
}

export async function updatePlay(
  playId: string,
  fields: Partial<Omit<SimPlay, 'id' | 'user_id' | 'deal_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('sim_plays')
    .update(fields)
    .eq('id', playId);
  if (error) throw error;
}

export async function fetchPlay(playId: string): Promise<SimPlay> {
  const { data, error } = await supabase
    .from('sim_plays')
    .select('*')
    .eq('id', playId)
    .single();
  if (error) throw error;
  return data as SimPlay;
}

export async function fetchMyPlays(userId: string): Promise<SimPlay[]> {
  const { data, error } = await supabase
    .from('sim_plays')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SimPlay[];
}
