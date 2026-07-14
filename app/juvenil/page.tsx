'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface Perfil {
    id: string
    nome: string
    email: string
    role: string
}

interface Culto {
    id: string
    data: string
    dia_semana: string
    tema: string | null
}

export default function JuvenilDashboard() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [proximosCultos, setProximosCultos] = useState<Culto[]>([])
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        inicializar()
    }, [])

    async function inicializar() {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: perfilData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!perfilData || perfilData.role !== 'juvenil') {
                router.push('/login')
                return
            }

            setPerfil(perfilData)

            const hoje = new Date().toISOString().split('T')[0]
            const { data: cultosData } = await supabase
                .from('cultos')
                .select('*')
                .gte('data', hoje)
                .eq('status', 'agendado')
                .order('data', { ascending: true })
                .limit(3)

            setProximosCultos(cultosData || [])
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    function formatarData(data: string) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
    }

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-cyan-400">
                <div className="text-6xl animate-bounce">🎈</div>
            </div>
        )
    }

    if (!perfil) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
            
            {/* Header colorido e divertido */}
            <header className="bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🎉</span>
                        <div>
                            <h1 className="text-xl font-bold">Rede Juvenil</h1>
                            <p className="text-xs text-blue-100">Área do Juvenil ✨</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold">{perfil.nome}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 lg:p-8">
                
                {/* Boas-vindas colorido */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl p-8 mb-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-6xl opacity-20">✨</div>
                    <div className="absolute bottom-4 left-4 text-6xl opacity-20">🎈</div>
                    
                    <div className="relative z-10">
                        <div className="text-6xl mb-3">👋</div>
                        <h2 className="text-3xl font-bold mb-2">
                            Oi, {perfil.nome.split(' ')[0]}!
                        </h2>
                        <p className="text-blue-100 text-lg">
                            Que bom te ver aqui! 💙
                        </p>
                    </div>
                </div>

                {/* Versículo da semana */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6 border-l-4 border-yellow-400">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">📖</span>
                        <div>
                            <p className="text-xs font-bold text-yellow-600 uppercase mb-1">
                                Versículo da Semana
                            </p>
                            <p className="text-gray-800 italic">
                                &quot;Porque para Deus nada é impossível!&quot;
                            </p>
                            <p className="text-sm text-gray-500 mt-2">— Lucas 1:37</p>
                        </div>
                    </div>
                </div>

                {/* Próximos Cultos */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        📅 Próximos Cultos
                    </h3>
                    
                    {proximosCultos.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-4xl mb-2">🎈</p>
                            <p className="text-gray-600">
                                Nenhum culto agendado no momento
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {proximosCultos.map((culto) => (
                                <div 
                                    key={culto.id}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200"
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-md flex-shrink-0 ${
                                        culto.dia_semana === 'domingo' 
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                            : 'bg-gradient-to-br from-orange-400 to-orange-500'
                                    }`}>
                                        <span className="text-2xl font-bold">
                                            {culto.data.split('-')[2]}
                                        </span>
                                        <span className="text-xs uppercase">
                                            {new Date(culto.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 capitalize text-lg">
                                            {culto.dia_semana}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {formatarData(culto.data)}
                                        </p>
                                        {culto.tema && (
                                            <p className="text-sm text-blue-600 font-semibold mt-1">
                                                🌟 {culto.tema}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Menu com botões grandes e coloridos */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Link
                        href="/materiais"
                        className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-3xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition transform text-center"
                    >
                        <div className="text-6xl mb-3">📚</div>
                        <p className="font-bold text-xl">Materiais</p>
                        <p className="text-sm text-purple-100 mt-1">Devocionais e mais</p>
                    </Link>
                    
                    <Link
                        href="/avisos"
                        className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-3xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition transform text-center"
                    >
                        <div className="text-6xl mb-3">📣</div>
                        <p className="font-bold text-xl">Avisos</p>
                        <p className="text-sm text-yellow-100 mt-1">Novidades</p>
                    </Link>
                </div>

                {/* Rodapé motivacional */}
                <div className="bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl shadow p-6 text-white text-center">
                    <p className="text-2xl mb-2">💚</p>
                    <p className="font-bold text-lg">Deus te ama muito!</p>
                    <p className="text-sm text-green-100 mt-1">
                        Você faz parte de algo incrível! 🌟
                    </p>
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025
                </p>
            </main>
        </div>
    )
}