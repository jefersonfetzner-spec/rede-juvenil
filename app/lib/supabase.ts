// ============================================
// CONFIGURAÇÃO DO SUPABASE
// Este arquivo cria a conexão com o banco de dados
// ============================================

import { createClient } from '@supabase/supabase-js'

// Pega as chaves do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria o cliente do Supabase
// Este cliente vai ser usado em todas as páginas
// para conversar com o banco de dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey)