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
    fonte: string
}

export default function MinistroDashboard() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [ministroId, setMinistroId] = useState<string | null>(null)
    const [proximosCultos, setProximosCultos] = useState<Culto[]>([])
    const [meusCultos, setMeusCultos] = useState<Culto[]>([])
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

            if (!perfilData || perfilData.role !== 'ministro') {
                router.push('/login')
                return
            }

            setPerfil(perfilData)

            // Buscar ID do ministro
            const { data: ministroData } = await supabase
                .from('ministros')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (ministroData) {
                setMinistroId(ministroData.id)
                
                // Buscar meus cultos escalados
                const { data: minhasEscalas } = await supabase
                    .from('escala_ministros')
                    .select('culto_id, cultos(*)')
                    .eq('ministro_id', ministroData.id)

                if (minhasEscalas) {
                    const cultosEscalados = minhasEscalas
                        .map(e => e.cultos as unknown as Culto)
                        .filter(c => c && new Date(c.data + 'T12:00:00') >= new Date(new Date().setHours(0,0,0,0)))
                        .sort((a, b) => a.data.localeCompare(b.data))
                    
                    setMeusCultos(cultosEscalados)
                }
            }

            // Buscar próximos cultos (todos)
            const hoje = new Date().toISOString().split('T')[0]
            const { data: cultosData } = await supabase
                .from('cultos')
                .select('*')
                .gte('data', hoje)
                .eq('status', 'agendado')
                .order('data', { ascending: true })
                .limit(5)

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
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-6xl animate-bounce">⏳</div>
            </div>
        )
    }

    if (!perfil) return null

    return (
        <div className="min-h-screen bg-gray-100">
            
            {/* Header */}
            <header className="bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⛪</span>
                        <div>
                            <h1 className="text-xl font-bold">Rede Juvenil</h1>
                            <p className="text-xs text-pink-100">Painel do Ministro</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold">{perfil.nome}</p>
                            <p className="text-xs text-pink-100">{perfil.email}</p>
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
                
                {/* Boas-vindas */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Olá, {perfil.nome.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600">
                        Que Deus abençoe seu ministério hoje!
                    </p>
                </div>

                {/* Meus Cultos Escalados */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        📋 Minhas Escalas Confirmadas
                    </h3>
                    
                    {meusCultos.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-4xl mb-2">📅</p>
                            <p className="text-gray-600">
                                Você ainda não está escalado em nenhum culto.
                            </p>
                            <Link 
                                href="/escalas"
                                className="inline-block mt-3 text-pink-600 hover:underline font-semibold"
                            >
                                Ver escalas disponíveis →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {meusCultos.map((culto) => (
                                <div 
                                    key={culto.id}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-200"
                                >
                                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0 ${
                                        culto.dia_semana === 'domingo' 
                                            ? 'bg-blue-500' 
                                            : 'bg-orange-500'
                                    }`}>
                                        <span className="text-xl font-bold">
                                            {culto.data.split('-')[2]}
                                        </span>
                                        <span className="text-xs uppercase">
                                            {new Date(culto.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 capitalize">
                                            {culto.dia_semana} - {formatarData(culto.data)}
                                        </p>
                                        {culto.tema && (
                                            <p className="text-sm text-gray-600">📖 {culto.tema}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Menu de Navegação */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/escalas"
                        className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition text-center group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition">📋</div>
                        <p className="font-bold text-gray-800">Escalas</p>
                        <p className="text-xs text-gray-500">Me inscrever</p>
                    </Link>
                    <Link
                        href="/cultos"
                        className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition text-center group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition">📅</div>
                        <p className="font-bold text-gray-800">Cultos</p>
                        <p className="text-xs text-gray-500">Ver agenda</p>
                    </Link>
                    <Link
                        href="/materiais"
                        className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition text-center group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition">📚</div>
                        <p className="font-bold text-gray-800">Materiais</p>
                        <p className="text-xs text-gray-500">Roteiros</p>
                    </Link>
                    <Link
                        href="/avisos"
                        className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition text-center group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition">📣</div>
                        <p className="font-bold text-gray-800">Avisos</p>
                        <p className="text-xs text-gray-500">Comunicados</p>
                    </Link>
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025
                </p>
            </main>
        </div>
    )
}