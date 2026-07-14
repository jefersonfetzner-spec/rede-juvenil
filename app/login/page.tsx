'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setErro('')
        setCarregando(true)

        try {
            // Fazer login no Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: senha,
            })

            if (error) {
                throw error
            }

            if (data.user) {
                // Buscar o perfil (role) do usuário
                const { data: perfil, error: erroPerfil } = await supabase
                    .from('profiles')
                    .select('role, nome, ativo')
                    .eq('id', data.user.id)
                    .single()

                if (erroPerfil) {
                    throw new Error('Erro ao buscar perfil')
                }

                if (!perfil.ativo) {
                    throw new Error('Usuário desativado. Contate o líder.')
                }

                // Redirecionar baseado no role
                switch (perfil.role) {
                    case 'lider':
                        router.push('/dashboard')
                        break
                    case 'ministro':
                        router.push('/dashboard')
                        break
                    case 'pai':
                        router.push('/pais')
                        break
                    case 'juvenil':
                        router.push('/juvenis')
                        break
                    default:
                        router.push('/dashboard')
                }
            }
        } catch (error: unknown) {
            const mensagem = error instanceof Error 
                ? error.message 
                : 'Erro ao fazer login'
            
            // Traduzir mensagens comuns do Supabase
            if (mensagem.includes('Invalid login credentials')) {
                setErro('Email ou senha incorretos')
            } else if (mensagem.includes('Email not confirmed')) {
                setErro('Email não confirmado')
            } else {
                setErro(mensagem)
            }
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                
                {/* Cabeçalho */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-2">🙏</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Rede Juvenil
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Ministério Juvenil - 10 a 12 anos
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleLogin} className="space-y-4">
                    
                    {/* Campo Email */}
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800"
                            placeholder="seu@email.com"
                            disabled={carregando}
                        />
                    </div>

                    {/* Campo Senha */}
                    <div>
                        <label 
                            htmlFor="senha" 
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Senha
                        </label>
                        <input
                            id="senha"
                            type="password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800"
                            placeholder="••••••••"
                            disabled={carregando}
                        />
                    </div>

                    {/* Mensagem de erro */}
                    {erro && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            ⚠️ {erro}
                        </div>
                    )}

                    {/* Botão Login */}
                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {carregando ? '⏳ Entrando...' : '🚀 Entrar'}
                    </button>
                </form>

                {/* Rodapé */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                        Líderes: Jeferson & Dienifer
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        © 2025 Rede Juvenil
                    </p>
                </div>
            </div>
        </div>
    )
}