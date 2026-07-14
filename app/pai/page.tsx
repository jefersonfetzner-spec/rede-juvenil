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

interface Juvenil {
    id: string
    nome: string
    data_nascimento: string
}

interface Culto {
    id: string
    data: string
    dia_semana: string
    tema: string | null
}

export default function PaiDashboard() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [filhos, setFilhos] = useState<Juvenil[]>([])
    const [meusLanches, setMeusLanches] = useState<Culto[]>([])
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

            if (!perfilData || perfilData.role !== 'pai') {
                router.push('/login')
                return
            }

            setPerfil(perfilData)

            const { data: paiData } = await supabase
                .from('pais')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (paiData) {
                const { data: vinculos } = await supabase
                    .from('pai_juvenil')
                    .select('juvenis(id, nome, data_nascimento)')
                    .eq('pai_id', paiData.id)

                if (vinculos) {
                    const filhosData = vinculos
                        .map(v => v.juvenis as unknown as Juvenil)
                        .filter(f => f)
                    setFilhos(filhosData)
                }

                const { data: lanches } = await supabase
                    .from('escala_lanches')
                    .select('culto_id, cultos(*)')
                    .eq('pai_id', paiData.id)

                if (lanches) {
                    const cultosLanche = lanches
                        .map(l => l.cultos as unknown as Culto)
                        .filter(c => c && new Date(c.data + 'T12:00:00') >= new Date(new Date().setHours(0,0,0,0)))
                        .sort((a, b) => a.data.localeCompare(b.data))
                    setMeusLanches(cultosLanche)
                }
            }
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

    function calcularIdade(dataNasc: string) {
        const hoje = new Date()
        const nasc = new Date(dataNasc)
        let idade = hoje.getFullYear() - nasc.getFullYear()
        const mes = hoje.getMonth() - nasc.getMonth()
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
            idade--
        }
        return idade
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
            
            <header className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">👨‍👩‍👧</span>
                        <div>
                            <h1 className="text-xl font-bold">Rede Juvenil</h1>
                            <p className="text-xs text-purple-100">Painel da Família</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold">{perfil.nome}</p>
                            <p className="text-xs text-purple-100">{perfil.email}</p>
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
                
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Olá, {perfil.nome.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600">
                        Que Deus abençoe sua família hoje!
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🧒 Meus Filhos no Ministério
                    </h3>
                    
                    {filhos.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-4xl mb-2">👶</p>
                            <p className="text-gray-600">
                                Você ainda não tem filhos vinculados.
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Entre em contato com a liderança!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filhos.map((filho) => (
                                <div 
                                    key={filho.id}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl text-white shadow-md">
                                        {filho.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">
                                            {filho.nome}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {calcularIdade(filho.data_nascimento)} anos
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🍰 Meus Lanches Confirmados
                    </h3>
                    
                    {meusLanches.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-4xl mb-2">📅</p>
                            <p className="text-gray-600">
                                Você ainda não se inscreveu para levar lanche.
                            </p>
                            <Link 
                                href="/escalas"
                                className="inline-block mt-3 text-purple-600 hover:underline font-semibold"
                            >
                                Ver escalas de lanche →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {meusLanches.map((culto) => (
                                <div 
                                    key={culto.id}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-200"
                                >
                                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0 ${
                                        culto.dia_semana === 'domingo' ? 'bg-blue-500' : 'bg-orange-500'
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/escalas"
                        className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition text-center group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition">🍰</div>
                        <p className="font-bold text-gray-800">Lanches</p>
                        <p className="text-xs text-gray-500">Se inscrever</p>
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
                        <p className="font-bold text-gray-800">Devocionais</p>
                        <p className="text-xs text-gray-500">Materiais</p>
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