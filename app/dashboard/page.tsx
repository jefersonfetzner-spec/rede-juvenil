'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Perfil {
    id: string
    nome: string
    email: string
    role: string
}

interface Contadores {
    juvenis: number
    pais: number
    ministros: number
    cultos: number
}

interface Aniversariante {
    id: string
    nome: string
    data_nascimento: string
    dia: number
}

interface UltimoCadastro {
    id: string
    nome: string
    tipo: string
    data: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [contadores, setContadores] = useState<Contadores>({
        juvenis: 0,
        pais: 0,
        ministros: 0,
        cultos: 0
    })
    const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])
    const [ultimosCadastros, setUltimosCadastros] = useState<UltimoCadastro[]>([])
    const [dataAtual, setDataAtual] = useState('')
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        verificarUsuario()
        atualizarData()
        const timer = setInterval(atualizarData, 60000)
        return () => clearInterval(timer)
    }, [])

    function atualizarData() {
        const agora = new Date()
        const opcoes: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }
        setDataAtual(agora.toLocaleDateString('pt-BR', opcoes))
    }

    async function verificarUsuario() {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (data.role !== 'lider' && data.role !== 'ministro') {
                router.push('/login')
                return
            }

            setPerfil(data)
            
            await Promise.all([
                buscarContadores(),
                buscarAniversariantes(),
                buscarUltimosCadastros()
            ])
        } catch (error) {
            console.error('Erro:', error)
            router.push('/login')
        } finally {
            setCarregando(false)
        }
    }

    async function buscarContadores() {
        try {
            const [juvenisRes, paisRes, ministrosRes, cultosRes] = await Promise.all([
                supabase.from('juvenis').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
                supabase.from('pais').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
                supabase.from('ministros').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
                supabase.from('cultos').select('*', { count: 'exact', head: true }).eq('status', 'agendado')
            ])

            setContadores({
                juvenis: juvenisRes.count || 0,
                pais: paisRes.count || 0,
                ministros: ministrosRes.count || 0,
                cultos: cultosRes.count || 0
            })
        } catch (error) {
            console.error('Erro ao buscar contadores:', error)
        }
    }

    async function buscarAniversariantes() {
        try {
            const { data } = await supabase
                .from('juvenis')
                .select('id, nome, data_nascimento')
                .eq('status', 'ativo')

            if (!data) return

            const mesAtual = new Date().getMonth() + 1
            const aniversariantesDoMes = data
                .filter(j => {
                    const mes = new Date(j.data_nascimento).getMonth() + 1
                    return mes === mesAtual
                })
                .map(j => ({
                    ...j,
                    dia: new Date(j.data_nascimento).getDate()
                }))
                .sort((a, b) => a.dia - b.dia)

            setAniversariantes(aniversariantesDoMes)
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error)
        }
    }

    async function buscarUltimosCadastros() {
        try {
            const [juvenisRes, paisRes, ministrosRes] = await Promise.all([
                supabase.from('juvenis').select('id, nome, created_at').order('created_at', { ascending: false }).limit(3),
                supabase.from('pais').select('id, nome, created_at').order('created_at', { ascending: false }).limit(3),
                supabase.from('ministros').select('id, nome, created_at').order('created_at', { ascending: false }).limit(3)
            ])

            const todos: UltimoCadastro[] = [
                ...(juvenisRes.data || []).map(j => ({ id: j.id, nome: j.nome, tipo: 'Juvenil', data: j.created_at })),
                ...(paisRes.data || []).map(p => ({ id: p.id, nome: p.nome, tipo: 'Pai/Mãe', data: p.created_at })),
                ...(ministrosRes.data || []).map(m => ({ id: m.id, nome: m.nome, tipo: 'Ministro', data: m.created_at }))
            ]

            const ordenados = todos
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                .slice(0, 5)

            setUltimosCadastros(ordenados)
        } catch (error) {
            console.error('Erro ao buscar últimos cadastros:', error)
        }
    }

    function formatarDataHora(data: string) {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">⏳</div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!perfil) return null

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar 
                nomeUsuario={perfil.nome}
                emailUsuario={perfil.email}
                roleUsuario={perfil.role}
            />

            <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                
                {/* Boas-vindas */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg p-6 lg:p-8 mb-6 mt-14 lg:mt-0 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                                Bem-vindo(a), {perfil.nome.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-blue-100">
                                Que Deus abençoe seu ministério hoje!
                            </p>
                        </div>
                        <div className="text-left lg:text-right">
                            <p className="text-xs text-blue-100 uppercase tracking-wider">Hoje</p>
                            <p className="text-lg font-semibold capitalize">{dataAtual}</p>
                        </div>
                    </div>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card 
                        icone="🧒" 
                        titulo="Juvenis Ativos" 
                        valor={contadores.juvenis.toString()} 
                        cor="from-blue-500 to-blue-600"
                        onClick={() => router.push('/juvenis')}
                    />
                    <Card 
                        icone="👨‍👩‍👧" 
                        titulo="Pais Ativos" 
                        valor={contadores.pais.toString()} 
                        cor="from-purple-500 to-purple-600"
                        onClick={() => router.push('/pais')}
                    />
                    <Card 
                        icone="⛪" 
                        titulo="Ministros" 
                        valor={contadores.ministros.toString()} 
                        cor="from-pink-500 to-pink-600"
                        onClick={() => router.push('/ministros')}
                    />
                    <Card 
                        icone="📅" 
                        titulo="Cultos Agendados" 
                        valor={contadores.cultos.toString()} 
                        cor="from-green-500 to-green-600"
                        onClick={() => router.push('/cultos')}
                    />
                </div>

                {/* Grid: Aniversariantes + Últimos Cadastros */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    
                    {/* Aniversariantes do Mês */}
                    <div className="bg-white rounded-2xl shadow p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-md">
                                🎂
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Aniversariantes do Mês
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {new Date().toLocaleDateString('pt-BR', { month: 'long' }).replace(/^./, c => c.toUpperCase())}
                                </p>
                            </div>
                        </div>
                        
                        {aniversariantes.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">🎈</div>
                                <p className="text-gray-500 text-sm">
                                    Nenhum aniversariante este mês
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {aniversariantes.map((aniv) => (
                                    <li 
                                        key={aniv.id}
                                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
                                    >
                                        <div className="bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                                            {aniv.dia}
                                        </div>
                                        <span className="font-medium text-gray-800">{aniv.nome}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Últimos Cadastros */}
                    <div className="bg-white rounded-2xl shadow p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-br from-green-400 to-teal-500 w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-md">
                                🆕
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Últimos Cadastros
                                </h3>
                                <p className="text-xs text-gray-500">
                                    5 mais recentes
                                </p>
                            </div>
                        </div>
                        
                        {ultimosCadastros.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-gray-500 text-sm">
                                    Nenhum cadastro ainda
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {ultimosCadastros.map((cad) => (
                                    <li 
                                        key={`${cad.tipo}-${cad.id}`}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg text-white font-bold ${
                                            cad.tipo === 'Juvenil' ? 'bg-blue-500' :
                                            cad.tipo === 'Pai/Mãe' ? 'bg-purple-500' :
                                            'bg-pink-500'
                                        }`}>
                                            {cad.tipo === 'Juvenil' ? '🧒' :
                                             cad.tipo === 'Pai/Mãe' ? '👨‍👩‍👧' : '⛪'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">
                                                {cad.nome}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {cad.tipo} • {formatarDataHora(cad.data)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        ⚡ Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <BotaoAcao 
                            icone="🧒" 
                            titulo="Novo Juvenil" 
                            cor="from-blue-500 to-blue-600"
                            onClick={() => router.push('/juvenis/novo')}
                        />
                        <BotaoAcao 
                            icone="👨‍👩‍👧" 
                            titulo="Novo Pai/Mãe" 
                            cor="from-purple-500 to-purple-600"
                            onClick={() => router.push('/pais/novo')}
                        />
                        <BotaoAcao 
                            icone="⛪" 
                            titulo="Novo Ministro" 
                            cor="from-pink-500 to-pink-600"
                            onClick={() => router.push('/ministros/novo')}
                        />
                        <BotaoAcao 
                            icone="📅" 
                            titulo="Novo Culto" 
                            cor="from-green-500 to-green-600"
                            onClick={() => router.push('/cultos')}
                        />
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025 | Ministério dos 10 a 12 anos
                </p>
            </main>
        </div>
    )
}

function Card({ icone, titulo, valor, cor, onClick }: { 
    icone: string, 
    titulo: string, 
    valor: string, 
    cor: string,
    onClick?: () => void
}) {
    return (
        <button 
            onClick={onClick}
            className="bg-white rounded-2xl shadow p-4 lg:p-6 hover:shadow-lg hover:scale-105 transition text-left"
        >
            <div className={`bg-gradient-to-br ${cor} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3 shadow-md`}>
                {icone}
            </div>
            <p className="text-gray-500 text-xs lg:text-sm">{titulo}</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-800">{valor}</p>
        </button>
    )
}

function BotaoAcao({ icone, titulo, cor, onClick }: { 
    icone: string, 
    titulo: string, 
    cor: string,
    onClick?: () => void
}) {
    return (
        <button 
            onClick={onClick}
            className={`bg-gradient-to-br ${cor} text-white rounded-xl p-4 hover:shadow-lg transition transform hover:scale-105 group`}
        >
            <div className="text-3xl mb-2">{icone}</div>
            <p className="font-semibold text-sm">{titulo}</p>
        </button>
    )
}